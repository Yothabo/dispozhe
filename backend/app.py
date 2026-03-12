from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import logging
import json
import asyncio
import traceback
import os
from contextlib import asynccontextmanager

from models.database import get_db, Session as DBSession, SessionLocal, init_db
from models.session import SessionCreate, SessionResponse, SessionStatus
from utils.tokens import generate_session_id
from services.expiry import ExpiryService
from services.websocket import WebSocketManager
from utils.code_generator import CodeGenerator

# Import security modules
from middleware.security_headers import add_security_headers
from middleware.rate_limiter import rate_limiter
from utils.validation import validator
from utils.audit import audit
from utils.cleanup import cleanup

# Import admin routes
from routes.admin import router as admin_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Reduce noise from specific modules
logging.getLogger('services.expiry').setLevel(logging.INFO)
logging.getLogger('services.expiry.repository').setLevel(logging.INFO)
logging.getLogger('services.expiry.scheduler').setLevel(logging.INFO)
logging.getLogger('services.websocket.handlers.connection_handler').setLevel(logging.INFO)
logging.getLogger('services.websocket.handlers.message_handler').setLevel(logging.INFO)
logging.getLogger('services.websocket.storage').setLevel(logging.WARNING)
logging.getLogger('middleware.rate_limiter').setLevel(logging.WARNING)
logging.getLogger('middleware.security_headers').setLevel(logging.WARNING)
logging.getLogger('uvicorn.access').setLevel(logging.WARNING)

# Keep audit logs at INFO level
logging.getLogger('audit').setLevel(logging.INFO)

# Initialize database on startup
init_db()

# Use timezone-aware UTC datetime
def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

# Frontend URL for links - this should be your frontend URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
MAX_DURATION = 24 * 60
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting backend in {ENVIRONMENT} mode...")
    app.state.expiry_service = ExpiryService()
    app.state.expiry_service.start()
    app.state.manager = WebSocketManager()
    app.state.code_generator = CodeGenerator()
    logger.info("Backend started successfully")
    yield
    logger.info("Shutting down backend...")
    app.state.expiry_service.stop()
    logger.info("Backend stopped")

app = FastAPI(title="dispozhe API", version="1.0.0", lifespan=lifespan)

# Include admin router
app.include_router(admin_router)

# Add security headers middleware
app.middleware("http")(add_security_headers)

# Trusted Host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "dispozhe.onrender.com",
        "driflly.vercel.app",
        "driflly.netlify.app",
        ".onrender.com",
        ".vercel.app",
        ".netlify.app",
    ]
)

# Get allowed origins from env
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:4173,http://127.0.0.1:3000").split(",")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["*"],
    max_age=600,
)

@app.get("/health")
async def health_check(request: Request):
    await rate_limiter(request)
    return {
        "status": "healthy",
        "service": "dispozhe backend",
        "environment": ENVIRONMENT,
        "security": "enabled"
    }

@app.get("/")
async def root(request: Request):
    await rate_limiter(request)
    return {
        "message": "dispozhe backend API",
        "docs": "/docs",
        "health": "/health",
        "security": "active",
        "environment": ENVIRONMENT
    }

@app.post("/session/create", response_model=SessionResponse)
async def create_session(request: SessionCreate, req: Request, db: Session = Depends(get_db)):
    await rate_limiter.strict(req)

    if not validator.validate_duration(request.duration):
        audit.log_auth_failure("unknown", req.client.host, "invalid_duration")
        raise HTTPException(400, f"Duration must be between 1 and {MAX_DURATION} minutes")

    session_id = generate_session_id()
    now = utc_now()
    future_expiry = now + timedelta(days=365)

    db_session = DBSession(
        id=session_id,
        created_at=now,
        expires_at=future_expiry,
        duration_minutes=request.duration,
        participant_count=1,
        status="waiting",
        link_active=True,
        chat_started_at=None
    )

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # Use FRONTEND_URL for the link, not BASE_URL
    link = f"{FRONTEND_URL}/c/{session_id}"
    code = app.state.code_generator.generate_code(session_id, future_expiry, "")

    audit.log_session_created(session_id, req.client.host, request.duration)

    logger.info(f"Session created: {session_id}, duration: {request.duration}min, code: {code}")
    logger.info(f"Session link: {link}")

    return SessionResponse(
        session_id=session_id,
        duration=request.duration,
        expires_at=future_expiry,
        link=link,
        status="waiting",
        code=code,
        time_left_seconds=request.duration * 60
    )

@app.post("/session/code/{code}")
async def join_by_code(code: str, req: Request):
    if not validator.validate_code(code):
        audit.log_auth_failure("unknown", req.client.host, "invalid_code_format")
        raise HTTPException(400, "Invalid code format")

    result = app.state.code_generator.redeem_code(code)

    if not result:
        audit.log_auth_failure("unknown", req.client.host, "invalid_code")
        raise HTTPException(404, "Invalid or expired code")

    db = SessionLocal()
    try:
        if not validator.validate_session_id(result["sessionId"]):
            audit.log_suspicious_activity(result["sessionId"], req.client.host, "invalid_session_id")
            raise HTTPException(400, "Invalid session ID")

        session = db.query(DBSession).filter(DBSession.id == result["sessionId"]).first()

        if not session:
            audit.log_auth_failure(result["sessionId"], req.client.host, "session_not_found")
            raise HTTPException(404, "Session not found")

        if session.status == "expired" or (session.chat_started_at and utc_now() > session.expires_at):
            audit.log_auth_failure(session.id, req.client.host, "session_expired")
            raise HTTPException(410, "Session expired")

        if session.participant_count >= 2:
            audit.log_auth_failure(session.id, req.client.host, "session_full")
            raise HTTPException(400, "Session is full")

        if session.participant_count == 1:
            now = utc_now()
            session.chat_started_at = now
            session.expires_at = now + timedelta(minutes=session.duration_minutes)
            session.status = "active"

        session.participant_count = 2
        session.link_active = False
        db.commit()

        audit.log_session_joined(session.id, req.client.host, via_code=True)

        logger.info(f"User joined session {session.id} via code {code}. Chat started at {session.chat_started_at}")

        return {
            "session_id": session.id,
            "encryption_key": result["encryptionKey"],
            "status": "active",
            "expires_at": session.expires_at.isoformat() if session.expires_at else None
        }
    finally:
        db.close()

@app.get("/session/{session_id}/status", response_model=SessionStatus)
async def get_session_status(session_id: str, req: Request, db: Session = Depends(get_db)):
    if not validator.validate_session_id(session_id):
        raise HTTPException(400, "Invalid session ID format")

    session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if not session:
        raise HTTPException(404, "Session not found")

    if session.chat_started_at and session.status == "active":
        time_left = int((session.expires_at - utc_now()).total_seconds())
        if time_left <= 0:
            session.status = "expired"
            session.link_active = False
            db.commit()
            logger.info(f"[Expiry] Session {session_id} expired during status check")
            time_left = 0
    elif session.status == "waiting":
        time_left = session.duration_minutes * 60
    else:
        time_left = 0

    return SessionStatus(
        session_id=session.id,
        participant_count=session.participant_count,
        status=session.status,
        expires_at=session.expires_at,
        time_left_seconds=max(0, time_left),
        created_at=session.created_at,
        chat_started_at=session.chat_started_at
    )

@app.post("/session/{session_id}/join")
async def join_session(session_id: str, req: Request, db: Session = Depends(get_db)):
    if not validator.validate_session_id(session_id):
        audit.log_auth_failure(session_id, req.client.host, "invalid_session_id")
        raise HTTPException(400, "Invalid session ID format")

    session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if not session:
        audit.log_auth_failure(session_id, req.client.host, "session_not_found")
        raise HTTPException(404, "Session not found")

    if session.status == "expired" or (session.chat_started_at and utc_now() > session.expires_at):
        session.status = "expired"
        session.link_active = False
        db.commit()
        audit.log_auth_failure(session_id, req.client.host, "session_expired")
        logger.info(f"[Expiry] Session {session_id} expired during join attempt")
        raise HTTPException(410, "Session expired")

    if session.participant_count >= 2:
        audit.log_auth_failure(session_id, req.client.host, "session_full")
        raise HTTPException(400, "Session is full")

    if session.participant_count == 1:
        now = utc_now()
        session.chat_started_at = now
        session.expires_at = now + timedelta(minutes=session.duration_minutes)
        session.status = "active"
        logger.info(f"[Timer] Session {session_id} timer started, expires at {session.expires_at}")

    session.participant_count = 2
    session.link_active = False
    db.commit()

    audit.log_session_joined(session_id, req.client.host, via_code=False)

    logger.info(f"Second participant joined session: {session_id}. Chat started at {session.chat_started_at}")

    return {
        "session_id": session.id,
        "status": "active",
        "message": "Joined successfully",
        "expires_at": session.expires_at.isoformat() if session.expires_at else None
    }

@app.post("/session/{session_id}/extend")
async def extend_session(session_id: str, request: Request, db: Session = Depends(get_db)):
    """Extend session duration"""
    if not validator.validate_session_id(session_id):
        raise HTTPException(400, "Invalid session ID format")

    # Parse request body
    try:
        body = await request.json()
        minutes = body.get("minutes")
    except:
        raise HTTPException(400, "Invalid request body")

    if not minutes or not isinstance(minutes, int) or minutes < 1 or minutes > 60:
        raise HTTPException(400, "Invalid minutes value (must be 1-60)")

    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")

    if session.status != "active":
        raise HTTPException(400, "Session is not active")

    # Extend the session
    session.expires_at = session.expires_at + timedelta(minutes=minutes)
    db.commit()

    logger.info(f"Session {session_id} extended by {minutes} minutes. New expiry: {session.expires_at}")

    # Broadcast time update to all connected clients
    try:
        time_left = int((session.expires_at - utc_now()).total_seconds())
        await app.state.manager.broadcast_to_session(session_id, {
            "type": "time_update",
            "time_left": max(0, time_left),
            "expires_at": session.expires_at.isoformat(),
            "timestamp": utc_now().isoformat()
        })
    except Exception as e:
        logger.error(f"Failed to broadcast time update: {e}")

    return {
        "session_id": session.id,
        "expires_at": session.expires_at.isoformat(),
        "minutes_added": minutes,
        "time_left_seconds": max(0, int((session.expires_at - utc_now()).total_seconds()))
    }

@app.post("/session/{session_id}/check-expiry")
async def check_session_expiry(session_id: str, request: Request, db: Session = Depends(get_db)):
    """Manually check if a session has expired and terminate if needed"""
    if not validator.validate_session_id(session_id):
        raise HTTPException(400, "Invalid session ID format")

    session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if not session:
        raise HTTPException(404, "Session not found")

    if session.status == "expired" or session.status == "terminated":
        return {"status": session.status, "message": "Session already terminated"}

    if session.chat_started_at and utc_now() > session.expires_at:
        session.status = "expired"
        session.link_active = False
        db.commit()
        logger.info(f"[Expiry] Manual check: Session {session_id} expired")

        # Terminate WebSocket connections
        try:
            await app.state.manager.terminate_session(session_id)
        except Exception as e:
            logger.error(f"Error during WebSocket termination: {e}")

        return {"status": "expired", "message": "Session has expired"}

    time_left = session.time_left()
    return {
        "status": session.status,
        "time_left_seconds": time_left,
        "expires_at": session.expires_at.isoformat()
    }

@app.delete("/session/{session_id}")
async def terminate_session(session_id: str, req: Request, db: Session = Depends(get_db)):
    if not validator.validate_session_id(session_id):
        audit.log_suspicious_activity(session_id, req.client.host, "invalid_session_id_termination")
        raise HTTPException(400, "Invalid session ID format")

    session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if not session:
        raise HTTPException(404, "Session not found")

    logger.info(f"Termination requested for session {session_id} from IP: {req.client.host}")

    initiator = "unknown"
    if session.participant_count == 1:
        initiator = "creator"
    else:
        initiator = "participant"
    audit.log_termination(session_id, req.client.host, initiator)

    try:
        await app.state.manager.terminate_session(session_id)
    except Exception as e:
        logger.error(f"Error during WebSocket termination: {e}")

    app.state.code_generator.remove_by_session(session_id)

    try:
        db.delete(session)
        db.commit()
        logger.info(f"Session {session_id} deleted from database")
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to terminate session")

    logger.info(f"Session {session_id} fully terminated")
    return {"status": "terminated"}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    client_host = websocket.client.host if websocket.client else "unknown"

    logger.info(f"[WebSocket] Connection attempt from {client_host} for session {session_id}")

    if not validator.validate_session_id(session_id):
        logger.warning(f"[WebSocket] Invalid session ID format from {client_host}: {session_id}")
        await websocket.close(code=1008, reason="Invalid session format")
        return

    db = SessionLocal()
    try:
        session = db.query(DBSession).filter(DBSession.id == session_id).first()

        if not session:
            logger.warning(f"[WebSocket] Session {session_id} not found")
            audit.log_auth_failure(session_id, client_host, "session_not_found")
            await websocket.close(code=1008, reason="Session not found")
            return

        if session.status == "expired" or (session.chat_started_at and utc_now() > session.expires_at):
            logger.warning(f"[WebSocket] Session {session_id} expired")
            audit.log_auth_failure(session_id, client_host, "session_expired")
            await websocket.close(code=1008, reason="Session expired")
            return

        if app.state.manager.get_connection_count(session_id) >= 2:
            logger.warning(f"[WebSocket] Session {session_id} already has 2 connections")
            audit.log_auth_failure(session_id, client_host, "max_connections")
            await websocket.close(code=1008, reason="Maximum connections reached")
            return

        await websocket.accept()
        logger.info(f"[WebSocket] Accepted for session {session_id} from {client_host}")

        await app.state.manager.connect(websocket, session_id)
        connection_count = app.state.manager.get_connection_count(session_id)

        if session.chat_started_at and session.status == "active":
            time_left = int((session.expires_at - utc_now()).total_seconds())
        else:
            time_left = session.duration_minutes * 60

        await websocket.send_text(json.dumps({
            "type": "connected",
            "session_id": session_id,
            "participant_count": session.participant_count,
            "connection_count": connection_count,
            "time_left": max(0, time_left),
            "chat_started_at": session.chat_started_at.isoformat() if session.chat_started_at else None,
            "timestamp": utc_now().isoformat()
        }))

        async def heartbeat():
            try:
                while True:
                    await asyncio.sleep(15)
                    if websocket.client_state.value == 1:
                        await websocket.send_text(json.dumps({
                            "type": "ping",
                            "timestamp": utc_now().isoformat()
                        }))
            except Exception:
                pass

        heartbeat_task = asyncio.create_task(heartbeat())

        try:
            while True:
                message = await websocket.receive_text()
                logger.info(f"[WebSocket] Received message from {session_id}")

                try:
                    message_data = json.loads(message)

                    # ZERO-KNOWLEDGE: Only handle system messages, pass through encrypted content
                    message_type = message_data.get('type', 'unknown')

                    if message_type in ['read_receipt', 'typing', 'participant_leaving', 'ping', 'pong']:
                        # System messages - broadcast as-is
                        if message_type == 'participant_leaving':
                            # Notify other participant
                            await app.state.manager.broadcast_to_session(
                                session_id,
                                {"type": "participant_left", "timestamp": utc_now().isoformat()},
                                exclude=websocket
                            )
                        else:
                            # Broadcast other system messages
                            await app.state.manager.broadcast_to_session(
                                session_id,
                                message_data,
                                exclude=websocket
                            )
                    else:
                        # ALL OTHER MESSAGES are treated as encrypted blobs
                        # Relay without ANY inspection or modification
                        status = await app.state.manager.send_message(
                            session_id,
                            message_data,  # Pass through untouched
                            websocket
                        )

                        # Send delivery status back to sender
                        if message_data.get('id'):
                            await websocket.send_text(json.dumps({
                                'type': 'delivery_status',
                                'message_id': message_data['id'],
                                'status': status['status'],
                                'timestamp': utc_now().isoformat()
                            }))

                except json.JSONDecodeError as e:
                    logger.error(f"[WebSocket] Failed to parse message as JSON: {e}")

        except WebSocketDisconnect:
            logger.info(f"[WebSocket] Disconnected from session {session_id}")
            await app.state.manager.disconnect(websocket, session_id)
        except Exception as e:
            logger.error(f"[WebSocket] Error for session {session_id}: {e}")
            await app.state.manager.disconnect(websocket, session_id)
        finally:
            heartbeat_task.cancel()

    except Exception as e:
        logger.error(f"[WebSocket] Endpoint error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8080,
        log_level="info"
    )
