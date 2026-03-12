from typing import Dict, Set, Optional
from fastapi import WebSocket
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ConnectionStore:
    """Simple connection storage"""
    
    def __init__(self):
        self.connections: Dict[str, Set[WebSocket]] = {}
        self.connection_to_session: Dict[WebSocket, str] = {}
    
    def add(self, session_id: str, websocket: WebSocket) -> int:
        """Add connection, return new count"""
        if session_id not in self.connections:
            self.connections[session_id] = set()
        
        self.connections[session_id].add(websocket)
        self.connection_to_session[websocket] = session_id
        
        return len(self.connections[session_id])
    
    def remove(self, session_id: str, websocket: WebSocket) -> int:
        """Remove connection, return remaining count"""
        if session_id not in self.connections:
            return 0
        
        self.connections[session_id].discard(websocket)
        self.connection_to_session.pop(websocket, None)
        
        remaining = len(self.connections[session_id])
        if remaining == 0:
            del self.connections[session_id]
        
        return remaining
    
    def get_session_id(self, websocket: WebSocket) -> Optional[str]:
        """Get session for connection"""
        return self.connection_to_session.get(websocket)
    
    def get_connections(self, session_id: str) -> Set[WebSocket]:
        """Get all connections for session"""
        return self.connections.get(session_id, set())
    
    def get_count(self, session_id: str) -> int:
        """Get connection count"""
        return len(self.get_connections(session_id))
