from typing import Dict, Set, Optional
from fastapi import WebSocket
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ConnectionStore:
    """Stores active WebSocket connections"""
    
    def __init__(self):
        self.connections: Dict[str, Set[WebSocket]] = {}
        self.connection_to_session: Dict[WebSocket, str] = {}
        self.connection_times: Dict[WebSocket, datetime] = {}
    
    def add(self, session_id: str, websocket: WebSocket) -> int:
        """Add connection to store, returns new count"""
        if session_id not in self.connections:
            self.connections[session_id] = set()
        
        self.connections[session_id].add(websocket)
        self.connection_to_session[websocket] = session_id
        self.connection_times[websocket] = datetime.utcnow()
        
        return len(self.connections[session_id])
    
    def remove(self, session_id: str, websocket: WebSocket) -> int:
        """Remove connection, returns remaining count"""
        if session_id not in self.connections:
            return 0
        
        self.connections[session_id].discard(websocket)
        
        # Clean up metadata
        self.connection_to_session.pop(websocket, None)
        self.connection_times.pop(websocket, None)
        
        remaining = len(self.connections[session_id])
        if remaining == 0:
            del self.connections[session_id]
        
        return remaining
    
    def get_session_id(self, websocket: WebSocket) -> Optional[str]:
        """Get session ID for a connection"""
        return self.connection_to_session.get(websocket)
    
    def get_connections(self, session_id: str) -> Set[WebSocket]:
        """Get all connections for a session"""
        return self.connections.get(session_id, set())
    
    def get_count(self, session_id: str) -> int:
        """Get connection count for a session"""
        return len(self.get_connections(session_id))
    
    def get_connection_duration(self, websocket: WebSocket) -> Optional[float]:
        """Get connection duration in seconds"""
        if websocket in self.connection_times:
            return (datetime.utcnow() - self.connection_times[websocket]).total_seconds()
        return None
    
    def has_connections(self, session_id: str) -> bool:
        """Check if session has any connections"""
        return session_id in self.connections and bool(self.connections[session_id])
