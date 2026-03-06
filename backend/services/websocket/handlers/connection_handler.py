from fastapi import WebSocket
import asyncio
import json
import logging
from datetime import datetime
from typing import Optional
from ..storage.connection_store import ConnectionStore
from .message_handler import MessageHandler

logger = logging.getLogger(__name__)

class ConnectionHandler:
    """Handles connection lifecycle events"""
    
    def __init__(self, connection_store: ConnectionStore, message_handler: MessageHandler):
        self.connections = connection_store
        self.messages = message_handler
        self.reconnect_window = 15  # seconds to wait before broadcasting leave
        self.terminating_sessions = set()
    
    async def connect(self, websocket: WebSocket, session_id: str) -> bool:
        """Handle new connection"""
        if session_id in self.terminating_sessions:
            logger.warning(f"Rejecting connection to terminating session {session_id}")
            await websocket.close(code=1008, reason="Session is terminating")
            return False
        
        count = self.connections.add(session_id, websocket)
        logger.info(f"Client connected to session {session_id}. Total: {count}")
        
        # Deliver any queued messages
        await self.messages.deliver_queued(session_id)
        
        if count == 2:
            logger.info(f"Session {session_id} now has both participants")
        
        return True
    
    async def disconnect(self, websocket: WebSocket):
        """Handle disconnection"""
        session_id = self.connections.get_session_id(websocket)
        if not session_id:
            return
        
        # Don't process disconnects during termination
        if session_id in self.terminating_sessions:
            logger.info(f"Disconnect ignored during termination for {session_id}")
            # Still remove from connection store but don't broadcast
            self.connections.remove(session_id, websocket)
            return
        
        remaining = self.connections.remove(session_id, websocket)
        logger.info(f"Client disconnected from {session_id}. Remaining: {remaining}")
        
        # Schedule leave broadcast if others remain
        if remaining > 0 and session_id not in self.terminating_sessions:
            asyncio.create_task(self._delayed_leave_broadcast(session_id, remaining))
    
    async def _delayed_leave_broadcast(self, session_id: str, expected_remaining: int):
        """Wait for reconnect then broadcast leave if needed"""
        await asyncio.sleep(self.reconnect_window)
        
        # Check if session is still active (not terminated)
        if session_id in self.terminating_sessions:
            return
        
        current_remaining = self.connections.get_count(session_id)
        if current_remaining == expected_remaining and current_remaining > 0:
            # Check if connections are still open before broadcasting
            connections = self.connections.get_connections(session_id)
            active_connections = []
            for conn in connections:
                try:
                    # Check if connection is still open
                    if conn.client_state.value == 1:  # WebSocketState.CONNECTED
                        active_connections.append(conn)
                except:
                    pass
            
            if active_connections:
                await self.messages.broadcast(
                    session_id,
                    json.dumps({
                        "type": "participant_left",
                        "participant_count": current_remaining,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                )
                logger.info(f"Broadcast participant_left to {session_id}")
    
    async def terminate_session(self, session_id: str):
        """Terminate a session and close all connections"""
        self.terminating_sessions.add(session_id)
        
        # Make a copy of connections to avoid "Set changed size during iteration"
        connections = list(self.connections.get_connections(session_id))
        if not connections:
            self.terminating_sessions.discard(session_id)
            return
        
        logger.info(f"Terminating session {session_id} with {len(connections)} connections")
        
        # First check which connections are still active
        active_connections = []
        for conn in connections:
            try:
                if conn.client_state.value == 1:  # WebSocketState.CONNECTED
                    active_connections.append(conn)
            except:
                pass
        
        # Notify active participants
        if active_connections:
            await self.messages.broadcast(
                session_id,
                json.dumps({
                    "type": "participant_left",
                    "participant_count": 1,
                    "timestamp": datetime.utcnow().isoformat()
                })
            )
            # Small delay for message delivery
            await asyncio.sleep(0.5)
        
        # Close all connections
        for conn in connections:
            try:
                await conn.close()
            except:
                pass
        
        # Remove from connection store
        if session_id in self.connections.connections:
            del self.connections.connections[session_id]
        
        self.terminating_sessions.discard(session_id)
        logger.info(f"Closed all connections for {session_id}")
    
    def is_terminating(self, session_id: str) -> bool:
        """Check if session is terminating"""
        return session_id in self.terminating_sessions
