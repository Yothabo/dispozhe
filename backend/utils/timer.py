import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Callable, Any
from models.database import SessionLocal, Session

logger = logging.getLogger(__name__)

class SessionTimer:
    def __init__(self):
        self.timers: Dict[str, asyncio.Task] = {}
        self.callbacks: Dict[str, Callable] = {}

    async def start_timer(self, session_id: str, duration_minutes: int, on_expire: Callable):
        """Start a timer for a session"""
        # Cancel existing timer if any
        if session_id in self.timers:
            self.timers[session_id].cancel()
        
        self.callbacks[session_id] = on_expire
        
        # Create new timer task
        task = asyncio.create_task(self._timer_task(session_id, duration_minutes))
        self.timers[session_id] = task
        logger.info(f"Started timer for session {session_id} ({duration_minutes} minutes)")

    async def _timer_task(self, session_id: str, duration_minutes: int):
        """Background task that waits for session to expire"""
        try:
            # Wait for the duration
            await asyncio.sleep(duration_minutes * 60)
            
            # Check if session still exists and is active
            db = SessionLocal()
            try:
                session = db.query(Session).filter(Session.id == session_id).first()
                if session and session.status == "active":
                    logger.info(f"Session {session_id} timer expired")
                    if session_id in self.callbacks:
                        await self.callbacks[session_id](session_id)
            finally:
                db.close()
                
        except asyncio.CancelledError:
            logger.info(f"Timer for session {session_id} was cancelled")
        except Exception as e:
            logger.error(f"Timer error for session {session_id}: {e}")
        finally:
            # Cleanup
            if session_id in self.timers:
                del self.timers[session_id]
            if session_id in self.callbacks:
                del self.callbacks[session_id]

    def cancel_timer(self, session_id: str):
        """Cancel timer for a session"""
        if session_id in self.timers:
            self.timers[session_id].cancel()
            logger.info(f"Cancelled timer for session {session_id}")

    def get_time_left(self, session_id: str) -> int:
        """Get approximate time left in seconds"""
        db = SessionLocal()
        try:
            session = db.query(Session).filter(Session.id == session_id).first()
            if not session:
                return 0
            return session.time_left()
        finally:
            db.close()
