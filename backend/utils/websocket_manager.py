from typing import Dict, Set
from fastapi import WebSocket
import logging
from datetime import datetime
import json
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.expiry_service = None
        self.connection_ids: Dict[WebSocket, str] = {}  # Track connection IDs to prevent duplicates

    def set_expiry_service(self, expiry_service):
        self.expiry_service = expiry_service

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()

        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()

        # Check if this websocket is already connected (prevent duplicates)
        if websocket in self.active_connections[session_id]:
            logger.warning(f"Duplicate WebSocket connection detected for session {session_id}")
            return

        self.active_connections[session_id].add(websocket)
        self.connection_ids[websocket] = session_id
        count = len(self.active_connections[session_id])
        logger.info(f"Client connected to session {session_id}. Total: {count}")

        if count == 2:
            logger.info(f"Session {session_id} now has both participants")

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
                if websocket in self.connection_ids:
                    del self.connection_ids[websocket]
                remaining = len(self.active_connections[session_id])
                logger.info(f"Client disconnected from session {session_id}. Remaining: {remaining}")

            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
                logger.info(f"Session {session_id} has no more connections")

    async def broadcast_to_session(self, session_id: str, message: str, exclude: WebSocket = None):
        if session_id in self.active_connections:
            # Get unique connections only
            connections = list(set(self.active_connections[session_id]))
            dead_connections = []

            for connection in connections:
                if connection != exclude:
                    try:
                        await connection.send_text(message)
                    except Exception as e:
                        logger.error(f"Error broadcasting to session {session_id}: {e}")
                        dead_connections.append(connection)

            for dead in dead_connections:
                self.disconnect(dead, session_id)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    def get_connection_count(self, session_id: str) -> int:
        return len(self.active_connections.get(session_id, set()))

    async def terminate_session(self, session_id: str):
        """Terminate a session - send DIFFERENT messages to each UNIQUE user"""
        if session_id not in self.active_connections:
            logger.info(f"Session {session_id} has no active connections")
            return

        # Get unique connections only (no duplicates)
        connections = list(set(self.active_connections[session_id]))
        logger.info(f"Terminating session {session_id} with {len(connections)} unique connections")

        # Send DIFFERENT messages to each connection
        messages_sent = 0
        initiator_sent = False

        for i, connection in enumerate(connections):
            try:
                # First connection gets "destroying_session" (initiator)
                # All others get "participant_leaving" (receivers)
                if not initiator_sent:
                    message_type = "destroying_session"
                    initiator_sent = True
                else:
                    message_type = "participant_leaving"

                await connection.send_text(json.dumps({
                    "type": message_type,
                    "timestamp": datetime.utcnow().isoformat()
                }))
                logger.info(f"Sent {message_type} to client in session {session_id}")
                messages_sent += 1
            except Exception as e:
                logger.error(f"Failed to send termination message: {e}")

        # Wait for messages to be sent
        if messages_sent > 0:
            await asyncio.sleep(0.5)

        # Close all connections
        for connection in connections:
            try:
                await connection.close()
            except:
                pass

        # Remove from active connections AFTER closing
        if session_id in self.active_connections:
            del self.active_connections[session_id]

        # Clean up connection IDs
        for conn in connections:
            if conn in self.connection_ids:
                del self.connection_ids[conn]

        logger.info(f"Closed all connections for session {session_id}")

    async def close_session_connections(self, session_id: str):
        """Legacy method - calls terminate_session"""
        await self.terminate_session(session_id)
