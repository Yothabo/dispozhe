from fastapi import WebSocket
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict
from ..storage.connection_store import ConnectionStore
from .message_handler import MessageHandler

logger = logging.getLogger(__name__)

class ConnectionHandler:
    """Handles connection lifecycle events with mobile-friendly reconnection"""
    
    def __init__(self, connection_store: ConnectionStore, message_handler: MessageHandler):
        self.connections = connection_store
        self.messages = message_handler
        self.reconnect_window = 120  # INCREASED to 120 seconds for mobile multitasking
        self.terminating_sessions = set()
        self.presence_tracker: Dict[str, datetime] = {}  # Track last seen time per session
    
    async def connect(self, websocket: WebSocket, session_id: str) -> bool:
        """Handle new connection"""
        if session_id in self.terminating_sessions:
            logger.warning(f"Rejecting connection to terminating session {session_id}")
            await websocket.close(code=1008, reason="Session is terminating")
            return False
        
        count = self.connections.add(session_id, websocket)
        self.presence_tracker[session_id] = datetime.utcnow()
        
        logger.info(f"Client connected to session {session_id}. Total: {count}")
        
        # If this is a reconnection, don't treat as new participant
        if count == 2:
            logger.info(f"Session {session_id} now has both participants (or reconnected)")
            # Broadcast reconnection event instead of new participant
            await self.messages.broadcast(
                session_id,
                json.dumps({
                    "type": "participant_reconnected",
                    "participant_count": count,
                    "timestamp": datetime.utcnow().isoformat()
                })
            )
        
        # Deliver any queued messages
        await self.messages.deliver_queued(session_id)
        
        return True
    
    async def disconnect(self, websocket: WebSocket):
        """Handle disconnection with extended grace period"""
        session_id = self.connections.get_session_id(websocket)
        if not session_id:
            return
        
        # Don't process disconnects during termination
        if session_id in self.terminating_sessions:
            logger.info(f"Disconnect ignored during termination for {session_id}")
            self.connections.remove(session_id, websocket)
            return
        
        remaining = self.connections.remove(session_id, websocket)
        logger.info(f"Client disconnected from {session_id}. Remaining: {remaining}")
        
        # Update presence tracker
        self.presence_tracker[session_id] = datetime.utcnow()
        
        # Schedule leave broadcast if others remain - with longer window
        if remaining > 0 and session_id not in self.terminating_sessions:
            asyncio.create_task(self._delayed_presence_check(session_id, remaining))
    
    async def _delayed_presence_check(self, session_id: str, expected_remaining: int):
        """Wait for reconnect, check if user is still active"""
        # Check every 30 seconds for 2 minutes total
        for attempt in range(4):  # 4 * 30s = 120s total
            await asyncio.sleep(30)
            
            # Check if session is still active
            if session_id in self.terminating_sessions:
                return
            
            current_remaining = self.connections.get_count(session_id)
            
            # If user reconnected, cancel
            if current_remaining == 2:
                logger.info(f"User reconnected to {session_id}, cancelling leave broadcast")
                return
            
            # If still disconnected after 2 minutes, broadcast leave
            if attempt == 3 and current_remaining == expected_remaining:
                # Check if connections are still open before broadcasting
                connections = self.connections.get_connections(session_id)
                active_connections = []
                for conn in connections:
                    try:
                        if conn.client_state.value == 1:  # WebSocketState.CONNECTED
                            active_connections.append(conn)
                    except:
                        pass
                
                if active_connections:
                    # Send "away" status first
                    await self.messages.broadcast(
                        session_id,
                        json.dumps({
                            "type": "participant_away",
                            "message": "Other user is away. Session will expire in 2 minutes if they don't return.",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    )
                    
                    # Wait additional 2 minutes for return
                    await asyncio.sleep(120)
                    
                    # Final check
                    final_remaining = self.connections.get_count(session_id)
                    if final_remaining == expected_remaining:
                        await self.messages.broadcast(
                            session_id,
                            json.dumps({
                                "type": "participant_left",
                                "participant_count": final_remaining,
                                "timestamp": datetime.utcnow().isoformat()
                            })
                        )
                        logger.info(f"User did not return to {session_id}, broadcasting leave")
    
    async def check_presence(self, session_id: str) -> Dict:
        """Get presence status for a session"""
        current_count = self.connections.get_count(session_id)
        last_seen = self.presence_tracker.get(session_id)
        
        return {
            "connected_count": current_count,
            "last_seen": last_seen.isoformat() if last_seen else None,
            "is_fully_connected": current_count == 2,
            "grace_period_seconds": self.reconnect_window
        }
    
    async def terminate_session(self, session_id: str):
        """Terminate a session and close all connections"""
        self.terminating_sessions.add(session_id)
        
        connections = list(self.connections.get_connections(session_id))
        if not connections:
            self.terminating_sessions.discard(session_id)
            return
        
        logger.info(f"Terminating session {session_id} with {len(connections)} connections")
        
        # Check which connections are still active
        active_connections = []
        for conn in connections:
            try:
                if conn.client_state.value == 1:
                    active_connections.append(conn)
            except:
                pass
        
        # Notify active participants
        if active_connections:
            await self.messages.broadcast(
                session_id,
                json.dumps({
                    "type": "session_terminating",
                    "reason": "user_initiated",
                    "timestamp": datetime.utcnow().isoformat()
                })
            )
            await asyncio.sleep(0.5)
        
        # Close all connections
        for conn in connections:
            try:
                await conn.close()
            except:
                pass
        
        # Clean up
        if session_id in self.connections.connections:
            del self.connections.connections[session_id]
        if session_id in self.presence_tracker:
            del self.presence_tracker[session_id]
        
        self.terminating_sessions.discard(session_id)
        logger.info(f"Closed all connections for {session_id}")
    
    def is_terminating(self, session_id: str) -> bool:
        return session_id in self.terminating_sessions
