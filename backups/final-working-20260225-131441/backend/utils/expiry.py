import threading
import time
import logging
from datetime import datetime, timedelta
from typing import Callable, Dict, List
from models.database import SessionLocal, Session

logger = logging.getLogger(__name__)

class ExpiryService:
    def __init__(self, check_interval: int = 60):
        self.check_interval = check_interval
        self.running = False
        self.thread = None
        self.callbacks: Dict[str, List[Callable]] = {}

    def start(self):
        """Start the expiry cleanup service"""
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        logger.info(f"Expiry cleanup service started (interval: {self.check_interval}s)")

    def stop(self):
        """Stop the expiry cleanup service"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Expiry cleanup service stopped")

    def register_callback(self, session_id: str, callback: Callable):
        """Register a callback for when a session expires"""
        if session_id not in self.callbacks:
            self.callbacks[session_id] = []
        self.callbacks[session_id].append(callback)

    def _run(self):
        """Main cleanup loop"""
        while self.running:
            try:
                self._cleanup_expired_sessions()
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in expiry cleanup: {e}")

    def _cleanup_expired_sessions(self):
        """Clean up expired sessions"""
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            # Only expire sessions that are at least 5 seconds old and truly expired
            # This prevents immediate expiration of new sessions
            expired = db.query(Session).filter(
                Session.expires_at < now,
                Session.status != "expired",
                Session.status != "terminated",
                Session.created_at < now - timedelta(seconds=5)  # Only expire sessions older than 5 seconds
            ).all()

            for session in expired:
                logger.info(f"Session {session.id} expired")
                session.status = "expired"
                session.link_active = False
                
                # Trigger callbacks
                if session.id in self.callbacks:
                    for callback in self.callbacks[session.id]:
                        try:
                            callback(session.id)
                        except Exception as e:
                            logger.error(f"Callback error for session {session.id}: {e}")
                    del self.callbacks[session.id]

            db.commit()
            
            if expired:
                logger.info(f"Marked {len(expired)} sessions as expired")
                
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            db.rollback()
        finally:
            db.close()

    def get_time_left(self, session_id: str) -> int:
        """Get time left for a session in seconds"""
        db = SessionLocal()
        try:
            session = db.query(Session).filter(Session.id == session_id).first()
            if not session:
                return 0
            return session.time_left()
        finally:
            db.close()
