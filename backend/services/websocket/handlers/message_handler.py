from fastapi import WebSocket
import json
import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from ..storage.message_store import MessageStore
from ..storage.connection_store import ConnectionStore
from ..models.queued_message import QueuedMessage
from ..security.replay_protection import ReplayProtection

logger = logging.getLogger(__name__)

class MessageHandler:
    """
    Zero-knowledge message relay with optional replay protection.
    Treats all messages as opaque blobs unless validation is enabled.
    """
    
    def __init__(self, connection_store: ConnectionStore, message_store: MessageStore):
        """
        Initialize message handler with stores and replay protection.
        
        Args:
            connection_store: Store for WebSocket connections
            message_store: Store for queued messages
        """
        self.connections = connection_store
        self.messages = message_store
        
        # Initialize replay protection (disabled by default for safe rollout)
        self.replay = ReplayProtection()
        
        logger.info("[MessageHandler] Initialized with replay protection (disabled)")
    
    def enable_replay_protection(self) -> None:
        """Enable replay protection - can be called at runtime"""
        self.replay.enable()
        logger.info("[MessageHandler] Replay protection enabled")
    
    def disable_replay_protection(self) -> None:
        """Disable replay protection - instant rollback capability"""
        self.replay.disable()
        logger.info("[MessageHandler] Replay protection disabled")
    
    def is_replay_protection_enabled(self) -> bool:
        """Check if replay protection is currently enabled"""
        return self.replay.is_enabled()

    async def send_message(self, session_id: str, message_data: Dict[str, Any], sender_ws: WebSocket) -> Dict[str, Any]:
        """
        Relay message to all other participants with optional validation.
        
        Args:
            session_id: Session identifier
            message_data: Message to relay
            sender_ws: Sender's WebSocket connection
            
        Returns:
            Dictionary with delivery status
        """
        message_id = message_data.get('id', str(uuid.uuid4()))
        message_type = message_data.get('type', 'unknown')

        logger.info(f"[Relay] Processing {message_type} message {message_id} for session {session_id}")

        # Basic format validation
        if not isinstance(message_data, dict):
            logger.error(f"[Relay] Invalid message format for {message_id}")
            return {'status': 'error', 'reason': 'invalid_format'}

        # Optional replay protection validation
        if self.replay.is_enabled():
            # Generate client ID from WebSocket object
            client_id = str(id(sender_ws))
            
            # Use session_id as secret key for HMAC (in production, use a real session secret)
            session_secret = session_id  # TODO: Replace with actual session secret
            
            # Validate message
            is_valid, reason = self.replay.validate_message(
                session_id, 
                client_id, 
                message_data,
                session_secret
            )
            
            if not is_valid:
                logger.warning(f"[Replay] Rejected message {message_id}: {reason}")
                return {
                    'status': 'rejected',
                    'message_id': message_id,
                    'reason': f'replay_protection: {reason}'
                }
            
            logger.debug(f"[Replay] Message {message_id} validated: {reason}")

        # Get recipients (all connections except sender)
        all_connections = self.connections.get_connections(session_id)
        recipients = all_connections - {sender_ws}

        logger.info(f"[Relay] Found {len(recipients)} recipients for {message_id}")

        # Queue message if no recipients online
        if not recipients:
            logger.info(f"[Relay] No recipients for {message_id}, queuing")
            queued = QueuedMessage(
                id=message_id,
                sender_id='unknown',
                content=message_data,
                timestamp=message_data.get('timestamp', '')
            )
            self.messages.queue_message(session_id, queued)
            return {
                'status': 'queued',
                'message_id': message_id,
                'queued': True
            }

        # Relay to all recipients
        success_count = 0
        failed_recipients = []

        for i, recipient in enumerate(recipients):
            try:
                # Forward exact message data without modification
                await recipient.send_text(json.dumps(message_data))
                success_count += 1
                logger.debug(f"[Relay] {message_id} forwarded to recipient {i+1}")
            except Exception as e:
                logger.error(f"[Relay] Failed to forward {message_id} to recipient {i+1}: {e}")
                failed_recipients.append(recipient)

        # Queue for failed recipients
        if failed_recipients:
            logger.info(f"[Relay] Queuing {message_id} for {len(failed_recipients)} failed recipients")
            queued = QueuedMessage(
                id=message_id,
                sender_id='unknown',
                content=message_data,
                timestamp=message_data.get('timestamp', '')
            )
            self.messages.queue_message(session_id, queued)

        # Return appropriate status
        if success_count == len(recipients):
            logger.info(f"[Relay] {message_id} delivered to all {success_count} recipients")
            return {'status': 'delivered', 'message_id': message_id}
        elif success_count > 0:
            logger.warning(f"[Relay] {message_id} delivered to {success_count}/{len(recipients)} recipients")
            return {'status': 'partial', 'message_id': message_id}
        else:
            logger.error(f"[Relay] Failed to deliver {message_id} to any recipient")
            return {'status': 'failed', 'message_id': message_id}

    async def broadcast(self, session_id: str, message: Dict[str, Any], exclude: Optional[WebSocket] = None) -> None:
        """
        Broadcast system message to all participants.
        
        Args:
            session_id: Session identifier
            message: Message to broadcast
            exclude: Optional connection to exclude
        """
        connections = self.connections.get_connections(session_id)
        message_str = json.dumps(message)

        if not connections:
            logger.warning(f"[Broadcast] No connections for session {session_id}")
            return

        logger.info(f"[Broadcast] Sending to {len(connections)} connections in session {session_id}")
        success_count = 0

        for conn in connections:
            if conn != exclude:
                try:
                    await conn.send_text(message_str)
                    success_count += 1
                except Exception as e:
                    logger.error(f"[Broadcast] Error sending to connection: {e}")

        logger.info(f"[Broadcast] Sent to {success_count}/{len(connections)} connections")

    async def broadcast_time_update(self, session_id: str, time_left: int, expires_at: str) -> None:
        """
        Broadcast time update to all participants.
        
        Args:
            session_id: Session identifier
            time_left: Seconds left in session
            expires_at: ISO format expiration time
        """
        await self.broadcast(session_id, {
            "type": "time_update",
            "time_left": time_left,
            "expires_at": expires_at,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.info(f"[TimeUpdate] Broadcast to session {session_id}: {time_left}s left")

    async def deliver_queued(self, session_id: str) -> None:
        """
        Deliver queued messages to newly connected participants.
        
        Args:
            session_id: Session identifier
        """
        queued = self.messages.get_queued_messages(session_id)
        if not queued:
            logger.debug(f"[Queue] No queued messages for session {session_id}")
            return

        recipients = self.connections.get_connections(session_id)
        if not recipients:
            logger.debug(f"[Queue] No recipients for session {session_id}, keeping {len(queued)} queued")
            return

        logger.info(f"[Queue] Attempting to deliver {len(queued)} queued messages to session {session_id}")

        delivered = 0
        messages_to_remove = []

        for msg in queued:
            for recipient in recipients:
                try:
                    await recipient.send_text(json.dumps(msg.content))
                    delivered += 1
                    messages_to_remove.append(msg.id)
                    logger.info(f"[Queue] Delivered queued message {msg.id}")
                    break
                except Exception as e:
                    logger.error(f"[Queue] Failed to deliver {msg.id}: {e}")

        # Remove delivered messages
        for msg_id in messages_to_remove:
            self.messages.remove_queued_message(session_id, msg_id)

        logger.info(f"[Queue] Delivered {delivered}/{len(queued)} queued messages")

    async def get_queue_size(self, session_id: str) -> int:
        """
        Get number of queued messages for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Number of queued messages
        """
        return len(self.messages.get_queued_messages(session_id))
    
    def cleanup_session(self, session_id: str) -> None:
        """
        Clean up all session data including replay protection.
        
        Args:
            session_id: Session to clean up
        """
        self.replay.cleanup_session(session_id)
        self.messages.cleanup_session(session_id)
        logger.info(f"[MessageHandler] Cleaned up session {session_id}")
