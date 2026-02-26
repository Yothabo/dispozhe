from typing import Dict, Set, List
from fastapi import WebSocket
import logging
from datetime import datetime
import json
import asyncio
from collections import defaultdict

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_ids: Dict[WebSocket, str] = {}
        self.connection_times: Dict[WebSocket, datetime] = {}
        self.message_queues: Dict[str, List[dict]] = defaultdict(list)  # New: message queue
        self.expiry_service = None

    def set_expiry_service(self, expiry_service):
        self.expiry_service = expiry_service

    async def connect(self, websocket: WebSocket, session_id: str):
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()

        # Check if this websocket is already connected
        if websocket in self.active_connections[session_id]:
            logger.warning(f"Duplicate WebSocket connection detected for session {session_id}")
            return True

        self.active_connections[session_id].add(websocket)
        self.connection_ids[websocket] = session_id
        self.connection_times[websocket] = datetime.utcnow()

        count = len(self.active_connections[session_id])
        logger.info(f"Client connected to session {session_id}. Total: {count}")

        # New: Deliver queued messages when second client connects
        if count == 2:
            logger.info(f"🎉 Session {session_id} now has both participants")
            await self.deliver_queued_messages(session_id)

        return True

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)

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
                # Clean up message queue when session ends
                if session_id in self.message_queues:
                    del self.message_queues[session_id]
                logger.info(f"Session {session_id} has no more connections")

    async def broadcast_to_session(self, session_id: str, message: str, exclude: WebSocket = None):
        """Broadcast message with queue fallback"""
        if session_id in self.active_connections:
            connections = list(self.active_connections[session_id])
            
            # If only one connection, queue the message for the other participant
            if len(connections) < 2:
                # Parse message to store properly
                try:
                    msg_data = json.loads(message)
                    self.message_queues[session_id].append({
                        'message': msg_data,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    logger.info(f"Message queued for session {session_id} - waiting for second participant")
                except json.JSONDecodeError:
                    logger.error(f"Failed to queue message: invalid JSON")
                return

            # Both connected, send immediately
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

    async def deliver_queued_messages(self, session_id: str):
        """Deliver all queued messages when both clients are connected"""
        if session_id not in self.message_queues or not self.message_queues[session_id]:
            return

        if session_id not in self.active_connections:
            return

        connections = list(self.active_connections[session_id])
        if len(connections) < 2:
            return

        logger.info(f"Delivering {len(self.message_queues[session_id])} queued messages for session {session_id}")
        
        # Deliver each queued message
        for msg_data in self.message_queues[session_id]:
            message_str = json.dumps(msg_data['message'])
            await self.broadcast_to_session(session_id, message_str, exclude=None)

        # Clear the queue
        del self.message_queues[session_id]

    def get_connection_count(self, session_id: str) -> int:
        return len(self.active_connections.get(session_id, set()))

    def get_active_sessions(self) -> int:
        return len(self.active_connections)

    async def terminate_session(self, session_id: str):
        if session_id not in self.active_connections:
            logger.info(f"Session {session_id} has no active connections")
            return

        connections = list(self.active_connections[session_id])
        logger.info(f"Terminating session {session_id} with {len(connections)} connections")

        for connection in connections:
            try:
                await connection.send_text(json.dumps({
                    "type": "session_terminated",
                    "timestamp": datetime.utcnow().isoformat()
                }))
            except Exception as e:
                logger.error(f"Failed to send termination message: {e}")

        await asyncio.sleep(0.5)

        for connection in connections:
            try:
                await connection.close()
            except:
                pass

        if session_id in self.active_connections:
            del self.active_connections[session_id]
        
        # Clean up message queue
        if session_id in self.message_queues:
            del self.message_queues[session_id]

        for conn in connections:
            if conn in self.connection_ids:
                del self.connection_ids[conn]
            if conn in self.connection_times:
                del self.connection_times[conn]

        logger.info(f"Closed all connections for session {session_id}")
