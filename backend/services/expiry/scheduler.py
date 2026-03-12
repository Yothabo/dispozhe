import threading
import time
import logging
from typing import Optional
from .config import ExpiryConfig
from .repository import ExpiryRepository
from .callbacks import CallbackRegistry

logger = logging.getLogger(__name__)

class ExpiryScheduler:
    """Background thread for session expiry cleanup"""

    def __init__(self, config: ExpiryConfig, repository: ExpiryRepository, callbacks: CallbackRegistry):
        self.config = config
        self.repository = repository
        self.callbacks = callbacks
        self.running = False
        self.thread: Optional[threading.Thread] = None

    def start(self):
        """Start the scheduler thread"""
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        logger.info(f"Expiry scheduler started (interval: {self.config.check_interval_seconds}s)")

    def stop(self):
        """Stop the scheduler thread"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Expiry scheduler stopped")

    def _run(self):
        """Main scheduler loop"""
        while self.running:
            try:
                self._check_expired_sessions()
                time.sleep(self.config.check_interval_seconds)
            except Exception as e:
                logger.error(f"Error in expiry check: {e}")

    def _check_expired_sessions(self):
        """Check for and handle expired sessions"""
        expired = self.repository.get_expired_sessions(self.config.min_session_age_seconds)

        if not expired:
            return

        logger.info(f"[Expiry] Processing {len(expired)} expired sessions")
        
        # Mark as expired in database
        self.repository.mark_multiple_expired(expired)

        # Trigger callbacks
        for session in expired:
            logger.info(f"[Expiry] Triggering expiry callback for session {session.id}")
            self.callbacks.trigger(session.id)
