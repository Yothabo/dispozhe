from typing import Dict, List, Callable
import logging

logger = logging.getLogger(__name__)

class CallbackRegistry:
    """Manages expiry callbacks for sessions"""
    
    def __init__(self):
        self.callbacks: Dict[str, List[Callable]] = {}
    
    def register(self, session_id: str, callback: Callable):
        """Register a callback for session expiry"""
        if session_id not in self.callbacks:
            self.callbacks[session_id] = []
        self.callbacks[session_id].append(callback)
        logger.debug(f"Registered callback for session {session_id}")
    
    def trigger(self, session_id: str):
        """Trigger all callbacks for a session"""
        if session_id in self.callbacks:
            for callback in self.callbacks[session_id]:
                try:
                    callback(session_id)
                except Exception as e:
                    logger.error(f"Callback error for session {session_id}: {e}")
            del self.callbacks[session_id]
    
    def unregister(self, session_id: str):
        """Remove all callbacks for a session"""
        if session_id in self.callbacks:
            del self.callbacks[session_id]
