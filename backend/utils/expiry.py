from sqlalchemy.orm import Session
from models.database import Session as DBSession, SessionLocal
from datetime import datetime, timedelta
import logging
import threading
import time

logger = logging.getLogger(__name__)

class ExpiryService:
    def __init__(self):
        self.running = False
        self.thread = None
    
    def start(self):
        """Start the cleanup service"""
        self.running = True
        self.thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.thread.start()
        logger.info("Expiry cleanup service started")
    
    def stop(self):
        """Stop the cleanup service"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Expiry cleanup service stopped")
    
    def _cleanup_loop(self):
        """Main cleanup loop - runs every 10 seconds"""
        while self.running:
            try:
                self._cleanup_expired_sessions()
            except Exception as e:
                logger.error(f"Error in cleanup: {e}")
            time.sleep(10)
    
    def _cleanup_expired_sessions(self):
        """Delete sessions that have expired"""
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            expired = db.query(DBSession).filter(DBSession.expires_at < now).all()
            
            for session in expired:
                logger.info(f"Cleaning up expired session: {session.id}")
                db.delete(session)
            
            db.commit()
            if expired:
                logger.info(f"Cleaned up {len(expired)} expired sessions")
        except Exception as e:
            logger.error(f"Error in cleanup: {e}")
        finally:
            db.close()
    
    def check_expired(self, session: DBSession) -> bool:
        """Check if a session is expired"""
        return datetime.utcnow() > session.expires_at
    
    def mark_expired(self, session_id: str):
        """Mark a session as expired (for manual termination)"""
        db = SessionLocal()
        try:
            session = db.query(DBSession).filter(DBSession.id == session_id).first()
            if session:
                session.status = "expired"
                session.link_active = False
                db.commit()
                logger.info(f"Session marked as expired: {session_id}")
        except Exception as e:
            logger.error(f"Error marking session expired: {e}")
        finally:
            db.close()
