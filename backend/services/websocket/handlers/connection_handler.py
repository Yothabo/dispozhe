from fastapi import WebSocket
import asyncio
import json
import logging
from datetime import datetime
from typing import Optional, Dict
from ..storage.connection_store import ConnectionStore
from .message_handler import MessageHandler

logger = logging.getLogger(__name__)

class ConnectionHandler:
    """Handles WebSocket connections"""

    def __init__(self, connection_store: ConnectionStore, message_handler: MessageHandler):
        self.connections = connection_store
        self.messages = message_handler
        self.terminating_sessions = set()
        self.reconnect_window = 15  # seconds to wait for reconnect
        self.presence_check_task = {}
        self.disconnect_times = {}  # Track when users disconnected

    async def connect(self, websocket: WebSocket, session_id: str) -> bool:
        """Connect a new client"""
        if session_id in self.terminating_sessions:
            logger.warning(f"Rejecting connection to terminating session {session_id}")
            await websocket.close(code=1008, reason="Session terminating")
            return False

        # Cancel any pending presence check for this session
        if session_id in self.presence_check_task:
            self.presence_check_task[session_id].cancel()
            del self.presence_check_task[session_id]

        # Clear disconnect time if exists
        if session_id in self.disconnect_times:
            del self.disconnect_times[session_id]

        count = self.connections.add(session_id, websocket)
        logger.info(f"Client connected to {session_id}. Total: {count}")

        if count == 2:
            logger.info(f"Session {session_id} now has both participants")
            # Notify both participants
            await self.messages.broadcast(session_id, {
                "type": "both_connected",
                "timestamp": datetime.utcnow().isoformat()
            })

        # Deliver any queued messages
        queue_size = await self.messages.get_queue_size(session_id)
        if queue_size > 0:
            logger.info(f"[Queue] {queue_size} queued messages waiting for session {session_id}")
            await self.messages.deliver_queued(session_id)

        return True

    async def disconnect(self, websocket: WebSocket):
        """Handle disconnection"""
        session_id = self.connections.get_session_id(websocket)
        if not session_id:
            return

        if session_id in self.terminating_sessions:
            logger.info(f"Disconnect ignored during termination")
            self.connections.remove(session_id, websocket)
            return

        remaining = self.connections.remove(session_id, websocket)
        logger.info(f"Client disconnected from {session_id}. Remaining: {remaining}")
        
        # Record disconnect time
        self.disconnect_times[session_id] = datetime.utcnow()

        if remaining == 1 and session_id not in self.terminating_sessions:
            # Check if there are queued messages
            queue_size = await self.messages.get_queue_size(session_id)
            if queue_size > 0:
                logger.info(f"[Queue] {queue_size} messages queued for disconnected user in {session_id}")
            
            # Create a task to check for reconnection
            self.presence_check_task[session_id] = asyncio.create_task(
                self._check_reconnection(session_id)
            )

        elif remaining == 0:
            # Session is now empty
            logger.info(f"Session {session_id} is now empty")
            # Clear disconnect time
            if session_id in self.disconnect_times:
                del self.disconnect_times[session_id]

    async def _check_reconnection(self, session_id: str):
        """Check if disconnected user reconnects within window"""
        try:
            # Wait for reconnect window
            await asyncio.sleep(self.reconnect_window)

            # Check if still disconnected
            if session_id in self.terminating_sessions:
                return

            current_count = self.connections.get_count(session_id)
            
            # If still only 1 user connected
            if current_count == 1:
                # Get the remaining connection
                connections = list(self.connections.get_connections(session_id))
                if connections:
                    # Check if there are queued messages
                    queue_size = await self.messages.get_queue_size(session_id)
                    
                    # Send participant_left to remaining user
                    await self.messages.broadcast(session_id, {
                        "type": "participant_left",
                        "participant_count": 1,
                        "timestamp": datetime.utcnow().isoformat(),
                        "queued_messages": queue_size
                    })
                    logger.info(f"Broadcast participant_left to {session_id} with {queue_size} queued messages")

        except asyncio.CancelledError:
            # Task was cancelled because user reconnected
            logger.info(f"Reconnection detected for {session_id}, cancelled leave broadcast")
        finally:
            # Clean up
            if session_id in self.presence_check_task:
                del self.presence_check_task[session_id]
            if session_id in self.disconnect_times:
                del self.disconnect_times[session_id]

    async def terminate_session(self, session_id: str):
        """Terminate a session"""
        self.terminating_sessions.add(session_id)

        # Cancel any pending presence check
        if session_id in self.presence_check_task:
            self.presence_check_task[session_id].cancel()
            del self.presence_check_task[session_id]

        # Clear disconnect time
        if session_id in self.disconnect_times:
            del self.disconnect_times[session_id]

        connections = list(self.connections.get_connections(session_id))
        if not connections:
            self.terminating_sessions.discard(session_id)
            return

        logger.info(f"Terminating session {session_id}")

        # Notify participants
        await self.messages.broadcast(session_id, {
            "type": "session_terminated",
            "timestamp": datetime.utcnow().isoformat()
        })

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

        self.terminating_sessions.discard(session_id)
        logger.info(f"Session {session_id} terminated")

    def is_terminating(self, session_id: str) -> bool:
        """Check if session is terminating"""
        return session_id in self.terminating_sessions
