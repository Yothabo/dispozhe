from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import json
import asyncio
from contextlib import asynccontextmanager
from collections import defaultdict
from typing import List, Dict

from models.database import get_db, Session as DBSession, SessionLocal
from models.session import SessionCreate, SessionResponse, SessionExtend, SessionStatus
from utils.tokens import generate_session_id, generate_security_token
from utils.expiry import ExpiryService
from utils.websocket_manager import ConnectionManager
from utils.code_generator import CodeGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:3000/"
MAX_DURATION = 24 * 60

# In-memory message queue for polling fallback
message_queue: Dict[str, List[dict]] = defaultdict(list)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Chatlly backend...")
    app.state.expiry_service = ExpiryService()
    app.state.expiry_service.start()
    app.state.manager = ConnectionManager()
    app.state.manager.set_expiry_service(app.state.expiry_service)
    app.state.code_generator = CodeGenerator()
    logger.info("Chatlly backend started successfully")
    yield
    logger.info("Shutting down Chatlly backend...")
    app.state.expiry_service.stop()
    logger.info("Chatlly backend stopped")

app = FastAPI(title="Chatlly API", description="Secure temporary chat backend - blind relay only", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://dispozhe.netlify.app", "https://dispozhe.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Chatlly backend"}

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
        code=code
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
        time_left_seconds=time_left
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

@app.post("/session/{session_id}/extend")
async def extend_session(session_id: str, request: SessionExtend, db: Session = Depends(get_db)):
    session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if not session:
        raise HTTPException(404, "Session not found")

    if session.status != "active":
        raise HTTPException(400, "Cannot extend - session is not active")

    max_expiry = datetime.utcnow() + timedelta(minutes=MAX_DURATION)
    new_expiry = session.expires_at + timedelta(minutes=request.minutes)

    if new_expiry > max_expiry:
        session.expires_at = max_expiry
    else:
        session.expires_at = new_expiry

    db.commit()
    logger.info(f"Session extended: {session_id}, +{request.minutes}min")

    return {
        "session_id": session.id,
        "extended_by": request.minutes,
        "expires_at": session.expires_at,
        "time_left_seconds": int((session.expires_at - datetime.utcnow()).total_seconds())
    }

@app.get("/session/{session_id}/messages")
async def get_polling_messages(session_id: str, since: int = 0):
    """Get messages for a session that were sent via polling"""
    global message_queue

    if session_id in message_queue:
        messages = [msg for msg in message_queue[session_id] if msg.get('timestamp', 0) > since]
        message_queue[session_id] = [msg for msg in message_queue[session_id] if msg.get('timestamp', 0) <= since]
        return {"messages": messages}

    return {"messages": []}

@app.post("/session/{session_id}/message")
async def send_polling_message(session_id: str, message: dict):
    """Send a message to a session via HTTP (used as WebSocket fallback)"""
    global message_queue

    message['timestamp'] = int(datetime.utcnow().timestamp() * 1000)
    message_queue[session_id].append(message)

    await app.state.manager.broadcast_to_session(
        session_id,
        json.dumps(message),
        exclude=None
    )

    return {"status": "sent"}

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
        logger.error(f"Error deleting session from database: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to terminate session")

    logger.info(f"Session {session_id} fully terminated")
    return {"status": "terminated"}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    db = SessionLocal()
    connection_id = None
    try:
        session = db.query(DBSession).filter(DBSession.id == session_id).first()

        if not session:
            await websocket.close(code=1008, reason="Session not found")
            return

        if session.status == "expired" or datetime.utcnow() > session.expires_at:
            await websocket.close(code=1008, reason="Session expired")
            return

        # Check if we already have 2 connections and this is a new one
        current_connections = app.state.manager.get_connection_count(session_id)
        if current_connections >= 2:
            logger.warning(f"Rejecting connection - session {session_id} already has {current_connections} connections")
            await websocket.close(code=1008, reason="Maximum connections reached")
            return

        await app.state.manager.connect(websocket, session_id)
        connection_count = app.state.manager.get_connection_count(session_id)
        logger.info(f"WebSocket connected for session {session_id}, total connections: {connection_count}")

        await websocket.send_text(json.dumps({
            "type": "connected",
            "session_id": session_id,
            "participant_count": session.participant_count,
            "connection_count": connection_count,
            "timestamp": datetime.utcnow().isoformat()
        }))

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

                try:
                    data = json.loads(message)
                    if data.get("type") == "pong":
                        continue
                except:
                    pass

                current_session = db.query(DBSession).filter(DBSession.id == session_id).first()
                if not current_session or current_session.status == "expired" or datetime.utcnow() > current_session.expires_at:
                    await websocket.send_text(json.dumps({
                        "type": "session_expired",
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                    break

                await app.state.manager.broadcast_to_session(
                    session_id,
                    message,
                    exclude=websocket
                )

        except WebSocketDisconnect:
            app.state.manager.disconnect(websocket, session_id)
            logger.info(f"WebSocket disconnected from session {session_id}")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            app.state.manager.disconnect(websocket, session_id)
        finally:
            heartbeat_task.cancel()

    finally:
        db.close()

@app.post("/admin/cleanup")
async def admin_cleanup():
    db = SessionLocal()
    count = 0
    try:
        now = datetime.utcnow()
        expired = db.query(DBSession).filter(DBSession.expires_at < now).all()

        for session in expired:
            try:
                await app.state.manager.terminate_session(session.id)
            except:
                pass
            app.state.code_generator.remove_by_session(session.id)
            db.delete(session)
            count += 1

        db.commit()
    finally:
        db.close()

    global message_queue
    message_queue.clear()

    return {"cleaned": count}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Chatlly backend"}

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
        code=code
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
        time_left_seconds=time_left
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

@app.post("/session/{session_id}/extend")
async def extend_session(session_id: str, request: SessionExtend, db: Session = Depends(get_db)):
    session = db.query(DBSession).filter(DBSession.id == session_id).first()

    if not session:
        raise HTTPException(404, "Session not found")

    if session.status != "active":
        raise HTTPException(400, "Cannot extend - session is not active")

    max_expiry = datetime.utcnow() + timedelta(minutes=MAX_DURATION)
    new_expiry = session.expires_at + timedelta(minutes=request.minutes)

    if new_expiry > max_expiry:
        session.expires_at = max_expiry
    else:
        session.expires_at = new_expiry

    db.commit()
    logger.info(f"Session extended: {session_id}, +{request.minutes}min")

    return {
        "session_id": session.id,
        "extended_by": request.minutes,
        "expires_at": session.expires_at,
        "time_left_seconds": int((session.expires_at - datetime.utcnow()).total_seconds())
    }

@app.get("/session/{session_id}/messages")
async def get_polling_messages(session_id: str, since: int = 0):
    """Get messages for a session that were sent via polling"""
    global message_queue

    if session_id in message_queue:
        messages = [msg for msg in message_queue[session_id] if msg.get('timestamp', 0) > since]
        message_queue[session_id] = [msg for msg in message_queue[session_id] if msg.get('timestamp', 0) <= since]
        return {"messages": messages}

    return {"messages": []}

@app.post("/session/{session_id}/message")
async def send_polling_message(session_id: str, message: dict):
    """Send a message to a session via HTTP (used as WebSocket fallback)"""
    global message_queue

    message['timestamp'] = int(datetime.utcnow().timestamp() * 1000)
    message_queue[session_id].append(message)

    await app.state.manager.broadcast_to_session(
        session_id,
        json.dumps(message),
        exclude=None
    )

    return {"status": "sent"}

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
        logger.error(f"Error deleting session from database: {e}")
        db.rollback()
        raise HTTPException(500, "Failed to terminate session")

    logger.info(f"Session {session_id} fully terminated")
    return {"status": "terminated"}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    db = SessionLocal()
    connection_id = None
    try:
        session = db.query(DBSession).filter(DBSession.id == session_id).first()

        if not session:
            await websocket.close(code=1008, reason="Session not found")
            return

        if session.status == "expired" or datetime.utcnow() > session.expires_at:
            await websocket.close(code=1008, reason="Session expired")
            return

        # Check if we already have 2 connections and this is a new one
        current_connections = app.state.manager.get_connection_count(session_id)
        if current_connections >= 2:
            logger.warning(f"Rejecting connection - session {session_id} already has {current_connections} connections")
            await websocket.close(code=1008, reason="Maximum connections reached")
            return

        await app.state.manager.connect(websocket, session_id)
        connection_count = app.state.manager.get_connection_count(session_id)
        logger.info(f"WebSocket connected for session {session_id}, total connections: {connection_count}")

        await websocket.send_text(json.dumps({
            "type": "connected",
            "session_id": session_id,
            "participant_count": session.participant_count,
            "connection_count": connection_count,
            "timestamp": datetime.utcnow().isoformat()
        }))

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

                try:
                    data = json.loads(message)
                    if data.get("type") == "pong":
                        continue
                except:
                    pass

                current_session = db.query(DBSession).filter(DBSession.id == session_id).first()
                if not current_session or current_session.status == "expired" or datetime.utcnow() > current_session.expires_at:
                    await websocket.send_text(json.dumps({
                        "type": "session_expired",
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                    break

                await app.state.manager.broadcast_to_session(
                    session_id,
                    message,
                    exclude=websocket
                )

        except WebSocketDisconnect:
            app.state.manager.disconnect(websocket, session_id)
            logger.info(f"WebSocket disconnected from session {session_id}")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            app.state.manager.disconnect(websocket, session_id)
        finally:
            heartbeat_task.cancel()

    finally:
        db.close()

@app.post("/admin/cleanup")
async def admin_cleanup():
    db = SessionLocal()
    count = 0
    try:
        now = datetime.utcnow()
        expired = db.query(DBSession).filter(DBSession.expires_at < now).all()

        for session in expired:
            try:
                await app.state.manager.terminate_session(session.id)
            except:
                pass
            app.state.code_generator.remove_by_session(session.id)
            db.delete(session)
            count += 1

        db.commit()
    finally:
        db.close()

    global message_queue
    message_queue.clear()

    return {"cleaned": count}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
