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
            return db.query(Session).filter(
                Session.expires_at < now,
                Session.status != "expired",
                Session.status != "terminated",
                Session.created_at < now - timedelta(seconds=min_age_seconds)
            ).all()
        finally:
            db.close()
    
    def mark_as_expired(self, session: Session):
        """Mark a single session as expired"""
        db = SessionLocal()
        try:
            session.status = "expired"
            session.link_active = False
            db.commit()
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
            logger.info(f"Marked {len(sessions)} sessions as expired")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to mark sessions as expired: {e}")
        finally:
            db.close()
