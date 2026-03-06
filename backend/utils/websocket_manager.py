from typing import Dict, Set, List, Optional
from fastapi import WebSocket
import logging
from datetime import datetime
import json
import asyncio
from collections import defaultdict
import uuid

logger = logging.getLogger(__name__)

class MessageStatus:
    SENT = "sent"
    QUEUED = "queued"
    DELIVERED = "delivered"
    READ = "read"

class QueuedMessage:
    def __init__(self, message_id: str, sender_id: str, content: dict, timestamp: str):
        self.id = message_id
        self.sender_id = sender_id
        self.content = content
        self.timestamp = timestamp
        self.retry_count = 0
        self.last_attempt = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_ids: Dict[WebSocket, str] = {}
        self.connection_times: Dict[WebSocket, datetime] = {}
        self.message_queues: Dict[str, List[QueuedMessage]] = defaultdict(list)
        self.message_status: Dict[str, Dict[str, str]] = defaultdict(dict)
        self.view_once_files: Dict[str, Dict] = {}
        self.viewed_files: Set[str] = set()
        self.expiry_service = None
        self.terminating_sessions: Set[str] = set()

    def set_expiry_service(self, expiry_service):
        self.expiry_service = expiry_service

    async def connect(self, websocket: WebSocket, session_id: str):
        if session_id in self.terminating_sessions:
            logger.warning(f"Rejecting connection to terminating session {session_id}")
            await websocket.close(code=1008, reason="Session is terminating")
            return False

        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()

        if websocket in self.active_connections[session_id]:
            return True

        self.active_connections[session_id].add(websocket)
        self.connection_ids[websocket] = session_id
        self.connection_times[websocket] = datetime.utcnow()

        count = len(self.active_connections[session_id])
        logger.info(f"Client connected to session {session_id}. Total: {count}")

        if session_id in self.message_queues and self.message_queues[session_id]:
            await self.deliver_queued_messages(session_id)

        if count == 2:
            logger.info(f"Session {session_id} now has both participants")

        return True

    async def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id not in self.active_connections:
            return

        # Skip if session is being terminated
        if session_id in self.terminating_sessions:
            logger.info(f"Disconnect ignored during termination for session {session_id}")
            return

        if websocket in self.active_connections[session_id]:
            self.active_connections[session_id].remove(websocket)

            remaining = len(self.active_connections[session_id])
            logger.info(f"Client disconnected from session {session_id}. Remaining: {remaining}")

            # Only broadcast participant_left if there are remaining participants
            # and this is not a termination scenario
            if remaining > 0 and session_id not in self.terminating_sessions:
                try:
                    await self.broadcast_to_session(
                        session_id,
                        json.dumps({
                            "type": "participant_left",
                            "participant_count": remaining,
                            "timestamp": datetime.utcnow().isoformat()
                        }),
                        exclude=None
                    )
                    logger.info(f"Broadcast participant_left to session {session_id}, remaining: {remaining}")
                except Exception as e:
                    logger.error(f"Failed to broadcast participant_left: {e}")

            if websocket in self.connection_times:
                duration = (datetime.utcnow() - self.connection_times[websocket]).total_seconds()
                logger.info(f"Connection for session {session_id} lasted {duration:.1f} seconds")
                del self.connection_times[websocket]

            if websocket in self.connection_ids:
                del self.connection_ids[websocket]

        if session_id in self.active_connections and not self.active_connections[session_id]:
            del self.active_connections[session_id]
            if session_id in self.message_queues:
                logger.info(f"Session {session_id} has no connections but keeping message queue with {len(self.message_queues[session_id])} messages")
            if session_id in self.message_status:
                del self.message_status[session_id]
            logger.info(f"Session {session_id} has no more connections")

    async def send_message(self, session_id: str, message_data: dict, sender_ws: WebSocket) -> dict:
        message_id = message_data.get('id', str(uuid.uuid4()))

        recipients = self.active_connections.get(session_id, set()) - {sender_ws}

        if message_data.get('type') == 'file' and message_data.get('viewOnce'):
            self.view_once_files[message_id] = {
                'session_id': session_id,
                'data': message_data,
                'viewed': False
            }

        if not recipients:
            queued_msg = QueuedMessage(
                message_id=message_id,
                sender_id='unknown',
                content=message_data,
                timestamp=datetime.utcnow().isoformat()
            )
            self.message_queues[session_id].append(queued_msg)
            return {'status': 'queued', 'message_id': message_id}

        for recipient in recipients:
            try:
                await recipient.send_text(json.dumps(message_data))
                logger.info(f"Message {message_id} sent to recipient")
            except Exception as e:
                logger.error(f"Failed to send message {message_id}: {e}")

        return {'status': 'delivered', 'message_id': message_id}

    async def handle_file_viewed(self, session_id: str, file_id: str, viewer_ws: WebSocket):
        if file_id in self.view_once_files:
            self.viewed_files.add(file_id)

            recipients = self.active_connections.get(session_id, set()) - {viewer_ws}
            for recipient in recipients:
                try:
                    await recipient.send_text(json.dumps({
                        'type': 'file_viewed',
                        'file_id': file_id,
                        'timestamp': datetime.utcnow().isoformat()
                    }))
                except Exception as e:
                    logger.error(f"Failed to send file viewed notification: {e}")

            del self.view_once_files[file_id]
            return True
        return False

    async def deliver_queued_messages(self, session_id: str):
        if session_id not in self.message_queues or not self.message_queues[session_id]:
            return

        recipients = self.active_connections.get(session_id, set())
        if not recipients:
            return

        messages_to_remove = []
        for queued_msg in self.message_queues[session_id]:
            delivered = False
            for recipient in recipients:
                try:
                    await recipient.send_text(json.dumps(queued_msg.content))
                    delivered = True
                except Exception as e:
                    logger.error(f"Failed to deliver queued message {queued_msg.id}: {e}")

            if delivered:
                messages_to_remove.append(queued_msg)

        for msg in messages_to_remove:
            self.message_queues[session_id].remove(msg)

    async def broadcast_to_session(self, session_id: str, message: str, exclude: WebSocket = None):
        if session_id in self.active_connections:
            connections = list(self.active_connections[session_id])
            for connection in connections:
                if connection != exclude:
                    try:
                        await connection.send_text(message)
                    except Exception as e:
                        logger.error(f"Error broadcasting to session {session_id}: {e}")

    def get_connection_count(self, session_id: str) -> int:
        return len(self.active_connections.get(session_id, set()))

    def get_active_sessions(self) -> int:
        return len(self.active_connections)

    async def terminate_session(self, session_id: str):
        # Mark session as terminating to reject new connections
        self.terminating_sessions.add(session_id)

        # Get connections
        connections = self.active_connections.get(session_id, set())
        if not connections:
            logger.info(f"Session {session_id} has no active connections")
            self.terminating_sessions.discard(session_id)
            return

        logger.info(f"Terminating session {session_id} with {len(connections)} connections")

        # Send participant_left to all participants
        await self.broadcast_to_session(
            session_id,
            json.dumps({
                "type": "participant_left",
                "participant_count": 1,
                "timestamp": datetime.utcnow().isoformat()
            }),
            exclude=None
        )
        logger.info(f"Broadcast participant_left to session {session_id} during termination")

        # Wait for message to be delivered
        await asyncio.sleep(0.5)

        # Remove from active connections
        if session_id in self.active_connections:
            del self.active_connections[session_id]

        # Close all connections
        for connection in connections:
            try:
                await connection.close()
            except:
                pass

        # Clean up associated data
        if session_id in self.message_queues:
            del self.message_queues[session_id]
        if session_id in self.message_status:
            del self.message_status[session_id]
        if session_id in self.view_once_files:
            del self.view_once_files[session_id]

        self.terminating_sessions.discard(session_id)

        # Clean up connection IDs and times
        for conn in connections:
            if conn in self.connection_ids:
                del self.connection_ids[conn]
            if conn in self.connection_times:
                del self.connection_times[conn]

        logger.info(f"Closed all connections for session {session_id}")
