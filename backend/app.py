from routes.stream import router as stream_router
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import json
import asyncio
import traceback
from contextlib import asynccontextmanager
from collections import defaultdict
from typing import List, Dict, Optional

from models.database import get_db, Session as DBSession, SessionLocal
from models.session import SessionCreate, SessionResponse, SessionExtend, SessionStatus
from utils.tokens import generate_session_id
from utils.expiry import ExpiryService
from utils.websocket_manager import ConnectionManager
from utils.code_generator import CodeGenerator

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BASE_URL = "https://driflly.vercel.app/"
MAX_DURATION = 24 * 60

message_queue: Dict[str, List[dict]] = defaultdict(list)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting backend...")
    app.state.expiry_service = ExpiryService()
    app.state.expiry_service.start()
    app.state.manager = ConnectionManager()
    app.state.manager.set_expiry_service(app.state.expiry_service)
    app.state.code_generator = CodeGenerator()
    logger.info("Backend started successfully")
    yield
    logger.info("Shutting down backend...")
    app.state.expiry_service.stop()
    logger.info("Backend stopped")

app = FastAPI(title="dispozhe API", version="1.0.0", lifespan=lifespan)

app.include_router(stream_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://dispozhe.netlify.app",
        "https://driflly.vercel.app",
        "https://driflly.netlify.app",
        "https://dispozhe.onrender.com",
        "https://driflly-backend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "dispozhe backend"}

@app.get("/")
async def root():
    return {"message": "dispozhe backend API", "docs": "/docs", "health": "/health"}

@app.post("/session/create", response_model=SessionResponse)
async def create_session(request: SessionCreate, db: Session = Depends(get_db)):
    if request.duration < 1 or request.duration > MAX_DURATION:
        raise HTTPException(400, f"Duration must be between 1 and {MAX_DURATION} minutes")

    session_id = generate_session_id()
    expires_at = datetime.utcnow() + timedelta(minutes=request.duration)

    db_session = DBSession(
        id=session_id,
        expires_at=expires_at,
        duration_minutes=request.duration,
        participant_count=1,
        status="waiting",
        link_active=True
    )

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    link = f"{BASE_URL}c/{session_id}"
    code = app.state.code_generator.generate_code(session_id, expires_at, "")

    logger.info(f"Session created: {session_id}, duration: {request.duration}min, code: {code}")

    return SessionResponse(
        session_id=session_id,
        duration=request.duration,
        expires_at=expires_at,
        link=link,
        status="waiting",
        code=code,
        time_left_seconds=request.duration * 60
    )

@app.post("/session/code/{code}")
async def join_by_code(code: str):
    result = app.state.code_generator.redeem_code(code)

    if not result:
        raise HTTPException(404, "Invalid or expired code")

    db = SessionLocal()
    try:
        session = db.query(DBSession).filter(DBSession.id == result["sessionId"]).first()

        if not session:
            raise HTTPException(404, "Session not found")

        if session.status == "expired" or datetime.utcnow() > session.expires_at:
            raise HTTPException(410, "Session expired")

        if session.participant_count >= 2:
            raise HTTPException(400, "Session is full")

        session.participant_count = 2
        session.status = "active"
        session.link_active = False
        db.commit()

        logger.info(f"User joined session {session.id} via code {code}")

        return {
            "session_id": session.id,
            "encryption_key": result["encryptionKey"],
            "status": "active"
        }
    finally:
        db.close()

@app.get("/session/{session_id}/status", response_model=SessionStatus)
async def get_session_status(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if not session:
        raise HTTPException(404, "Session not found")

    if datetime.utcnow() > session.expires_at:
        session.status = "expired"
        session.link_active = False
        db.commit()

    time_left = int((session.expires_at - datetime.utcnow()).total_seconds())
    if time_left < 0:
        time_left = 0

    return SessionStatus(
        session_id=session.id,
        participant_count=session.participant_count,
        status=session.status,
        expires_at=session.expires_at,
        time_left_seconds=time_left,
        created_at=session.created_at
    )

@app.post("/session/{session_id}/join")
async def join_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if not session:
        raise HTTPException(404, "Session not found")

    if datetime.utcnow() > session.expires_at:
        session.status = "expired"
        session.link_active = False
        db.commit()
        raise HTTPException(410, "Session expired")

    if session.participant_count >= 2:
        raise HTTPException(400, "Session is full")

    session.participant_count = 2
    session.status = "active"
    session.link_active = False
    db.commit()

    logger.info(f"Second participant joined session: {session_id}")

    return {
        "session_id": session.id,
        "status": "active",
        "message": "Joined successfully"
    }

@app.delete("/session/{session_id}")
async def terminate_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if not session:
        raise HTTPException(404, "Session not found")

    logger.info(f"Termination requested for session {session_id}")

    if session_id in message_queue:
        del message_queue[session_id]

    try:
        await app.state.manager.terminate_session(session_id)
    except Exception as e:
        logger.error(f"Error during WebSocket termination: {e}")

    app.state.code_generator.remove_by_session(session_id)

    try:
        db.delete(session)
        db.commit()
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to terminate session")

    logger.info(f"Session {session_id} fully terminated")
    return {"status": "terminated"}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    client_host = websocket.client.host if websocket.client else "unknown"
    logger.info(f"WebSocket connection attempt from {client_host} for session {session_id}")
    
    db = SessionLocal()
    try:
        session = db.query(DBSession).filter(DBSession.id == session_id).first()

        if not session:
            logger.warning(f"Session {session_id} not found")
            await websocket.close(code=1008, reason="Session not found")
            return

        logger.info(f"Session {session_id} found, status: {session.status}")

        if session.status == "expired" or session.status == "terminated" or datetime.utcnow() > session.expires_at:
            logger.warning(f"Session {session_id} expired")
            await websocket.close(code=1008, reason="Session expired")
            return

        # Accept connection
        await websocket.accept()
        logger.info(f"WebSocket accepted for session {session_id}")

        # Add to manager
        await app.state.manager.connect(websocket, session_id)
        connection_count = app.state.manager.get_connection_count(session_id)
        logger.info(f"WebSocket connected for session {session_id}, total connections: {connection_count}")

        # Send connected message
        time_left = session.time_left() if hasattr(session, 'time_left') else 300
        await websocket.send_text(json.dumps({
            "type": "connected",
            "session_id": session_id,
            "participant_count": session.participant_count,
            "connection_count": connection_count,
            "time_left": time_left,
            "timestamp": datetime.utcnow().isoformat()
        }))

        # Heartbeat to keep connection alive
        async def heartbeat():
            try:
                while True:
                    await asyncio.sleep(25)
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": datetime.utcnow().isoformat()
                    }))
            except:
                pass

        heartbeat_task = asyncio.create_task(heartbeat())

        try:
            while True:
                message = await websocket.receive_text()
                logger.debug(f"Received message from {session_id}: {message[:50]}")
                
                # Broadcast to other participants
                await app.state.manager.broadcast_to_session(
                    session_id,
                    message,
                    exclude=websocket
                )
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for session {session_id}")
            app.state.manager.disconnect(websocket, session_id)
        except Exception as e:
            logger.error(f"WebSocket error for session {session_id}: {e}")
            logger.error(traceback.format_exc())
            app.state.manager.disconnect(websocket, session_id)
        finally:
            heartbeat_task.cancel()

    except Exception as e:
        logger.error(f"WebSocket endpoint error: {e}")
        logger.error(traceback.format_exc())
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
