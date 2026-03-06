"""Main entry point for expiry service - combines all components"""
from .config import ExpiryConfig
from .repository import ExpiryRepository
from .callbacks import CallbackRegistry
from .scheduler import ExpiryScheduler
from models.database import SessionLocal, Session

class ExpiryService:
    """Facade for expiry management"""
    
    def __init__(self, check_interval: int = 60):
        self.config = ExpiryConfig(check_interval_seconds=check_interval)
        self.repository = ExpiryRepository()
        self.callbacks = CallbackRegistry()
        self.scheduler = ExpiryScheduler(self.config, self.repository, self.callbacks)
    
    def start(self):
        """Start the expiry service"""
        self.scheduler.start()
    
    def stop(self):
        """Stop the expiry service"""
        self.scheduler.stop()
    
    def register_callback(self, session_id: str, callback):
        """Register callback for session expiry"""
        self.callbacks.register(session_id, callback)
    
    def get_time_left(self, session_id: str) -> int:
        """Get time left for a session"""
        db = SessionLocal()
        try:
            session = db.query(Session).filter(Session.id == session_id).first()
            return session.time_left() if session else 0
        finally:
            db.close()
