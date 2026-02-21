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
        self.connection_ids: Dict[WebSocket, str] = {}
        self.connection_times: Dict[WebSocket, datetime] = {}
        self.expiry_service = None

    def set_expiry_service(self, expiry_service):
        self.expiry_service = expiry_service

    async def connect(self, websocket: WebSocket, session_id: str):
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()

        # Check if this websocket is already connected
        if websocket in self.active_connections[session_id]:
            logger.warning(f"Duplicate WebSocket connection detected for session {session_id}")
            return

        self.active_connections[session_id].add(websocket)
        self.connection_ids[websocket] = session_id
        self.connection_times[websocket] = datetime.utcnow()
        
        count = len(self.active_connections[session_id])
        logger.info(f"Client connected to session {session_id}. Total: {count}")

        if count == 2:
            logger.info(f"Session {session_id} now has both participants")

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
                
                # Calculate connection duration
                if websocket in self.connection_times:
                    duration = (datetime.utcnow() - self.connection_times[websocket]).total_seconds()
                    logger.info(f"Connection for session {session_id} lasted {duration:.1f} seconds")
                    del self.connection_times[websocket]
                
                if websocket in self.connection_ids:
                    del self.connection_ids[websocket]
                    
                remaining = len(self.active_connections[session_id])
                logger.info(f"Client disconnected from session {session_id}. Remaining: {remaining}")

            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
                logger.info(f"Session {session_id} has no more connections")

    async def broadcast_to_session(self, session_id: str, message: str, exclude: WebSocket = None):
        if session_id in self.active_connections:
            connections = list(self.active_connections[session_id])
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

    def get_connection_count(self, session_id: str) -> int:
        return len(self.active_connections.get(session_id, set()))

    def get_active_sessions(self) -> int:
        return len(self.active_connections)

    async def terminate_session(self, session_id: str):
        """Terminate a session and close all connections"""
        if session_id not in self.active_connections:
            logger.info(f"Session {session_id} has no active connections")
            return

        connections = list(self.active_connections[session_id])
        logger.info(f"Terminating session {session_id} with {len(connections)} connections")

        # Send termination message
        for connection in connections:
            try:
                await connection.send_text(json.dumps({
                    "type": "session_terminated",
                    "timestamp": datetime.utcnow().isoformat()
                }))
            except Exception as e:
                logger.error(f"Failed to send termination message: {e}")

        # Wait for messages to be sent
        await asyncio.sleep(0.5)

        # Close all connections
        for connection in connections:
            try:
                await connection.close()
            except:
                pass

        # Clean up
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        
        for conn in connections:
            if conn in self.connection_ids:
                del self.connection_ids[conn]
            if conn in self.connection_times:
                del self.connection_times[conn]

        logger.info(f"Closed all connections for session {session_id}")
