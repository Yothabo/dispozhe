from fastapi import WebSocket
import json
import uuid
import logging
from typing import Optional, Set
from ..storage.MessageStore import MessageStore
from ..storage.ConnectionStore import ConnectionStore
from ..models.QueuedMessage import QueuedMessage

logger = logging.getLogger(__name__)

class MessageHandler:
    """Handles sending and receiving messages"""
    
    def __init__(self, connection_store: ConnectionStore, message_store: MessageStore):
        self.connections = connection_store
        self.messages = message_store
    
    async def send_message(self, session_id: str, message_data: dict, sender_ws: WebSocket) -> dict:
        """Send a message to all other participants"""
        message_id = message_data.get('id', str(uuid.uuid4()))
        recipients = self.connections.get_connections(session_id) - {sender_ws}
        
        # Handle view-once files
        if message_data.get('type') == 'file' and message_data.get('viewOnce'):
            self.messages.add_view_once_file(message_id, {
                'session_id': session_id,
                'data': message_data,
                'viewed': False
            })
        
        if not recipients:
            # Queue message for later delivery
            queued = QueuedMessage(
                id=message_id,
                sender_id='unknown',
                content=message_data,
                timestamp=message_data.get('timestamp', '')
            )
            self.messages.queue_message(session_id, queued)
            return {'status': 'queued', 'message_id': message_id}
        
        # Send to all recipients
        for recipient in recipients:
            try:
                await recipient.send_text(json.dumps(message_data))
            except Exception as e:
                logger.error(f"Failed to send message {message_id}: {e}")
        
        return {'status': 'delivered', 'message_id': message_id}
    
    async def broadcast(self, session_id: str, message: str, exclude: Optional[WebSocket] = None):
        """Broadcast message to all connections in a session"""
        connections = self.connections.get_connections(session_id)
        for conn in connections:
            if conn != exclude:
                try:
                    await conn.send_text(message)
                except Exception as e:
                    logger.error(f"Broadcast error: {e}")
    
    async def deliver_queued(self, session_id: str):
        """Deliver all queued messages for a session"""
        queued = self.messages.get_queued_messages(session_id)
        if not queued:
            return
        
        recipients = self.connections.get_connections(session_id)
        if not recipients:
            return
        
        for msg in queued:
            for recipient in recipients:
                try:
                    await recipient.send_text(json.dumps(msg.content))
                except Exception as e:
                    logger.error(f"Failed to deliver queued {msg.id}: {e}")
            self.messages.remove_queued_message(session_id, msg.id)
    
    async def handle_file_viewed(self, session_id: str, file_id: str, viewer_ws: WebSocket):
        """Handle view-once file viewed notification"""
        if not self.messages.mark_file_viewed(file_id):
            return False
        
        # Notify other participants
        recipients = self.connections.get_connections(session_id) - {viewer_ws}
        notification = json.dumps({
            'type': 'file_viewed',
            'file_id': file_id,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        for recipient in recipients:
            try:
                await recipient.send_text(notification)
            except Exception as e:
                logger.error(f"Failed to send file viewed: {e}")
        
        return True
