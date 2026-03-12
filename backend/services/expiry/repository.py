from datetime import datetime, timedelta
from typing import List
from models.database import SessionLocal, Session
import logging

logger = logging.getLogger(__name__)

class ExpiryRepository:
    """Database operations for expired sessions"""

    def get_expired_sessions(self, min_age_seconds: int) -> List[Session]:
        """Get sessions that have expired and are old enough"""
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            expired = db.query(Session).filter(
                Session.expires_at < now,
                Session.status != "expired",
                Session.status != "terminated",
                Session.created_at < now - timedelta(seconds=min_age_seconds)
            ).all()
            
            if expired:
                logger.info(f"[Expiry] Found {len(expired)} expired sessions")
                for session in expired:
                    logger.info(f"[Expiry] Session {session.id} expired at {session.expires_at}")
            
            return expired
        finally:
            db.close()

    def mark_as_expired(self, session: Session):
        """Mark a single session as expired"""
        db = SessionLocal()
        try:
            session.status = "expired"
            session.link_active = False
            db.commit()
            logger.info(f"[Expiry] Marked session {session.id} as expired")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to mark session {session.id} as expired: {e}")
        finally:
            db.close()

    def mark_multiple_expired(self, sessions: List[Session]):
        """Mark multiple sessions as expired in a transaction"""
        if not sessions:
            return

        db = SessionLocal()
        try:
            for session in sessions:
                session.status = "expired"
                session.link_active = False
            db.commit()
            logger.info(f"[Expiry] Marked {len(sessions)} sessions as expired")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to mark sessions as expired: {e}")
        finally:
            db.close()
            
    def get_active_sessions(self) -> List[Session]:
        """Get all active sessions"""
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            active = db.query(Session).filter(
                Session.status == "active",
                Session.expires_at > now
            ).all()
            return active
        finally:
            db.close()
            
    def force_terminate(self, session_id: str) -> bool:
        """Force terminate a session"""
        db = SessionLocal()
        try:
            session = db.query(Session).filter(Session.id == session_id).first()
            if session:
                session.status = "terminated"
                session.link_active = False
                db.commit()
                logger.info(f"[Expiry] Force terminated session {session_id}")
                return True
            return False
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to force terminate session {session_id}: {e}")
            return False
        finally:
            db.close()
