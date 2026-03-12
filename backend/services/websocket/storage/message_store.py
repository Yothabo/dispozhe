from typing import Dict, List
from collections import defaultdict
from ..models.queued_message import QueuedMessage
import logging

logger = logging.getLogger(__name__)

class MessageStore:
    """Simple message storage"""
    
    def __init__(self):
        self.message_queues: Dict[str, List[QueuedMessage]] = defaultdict(list)
    
    def queue_message(self, session_id: str, message: QueuedMessage):
        """Queue message for later delivery"""
        self.message_queues[session_id].append(message)
    
    def get_queued_messages(self, session_id: str) -> List[QueuedMessage]:
        """Get queued messages"""
        return self.message_queues.get(session_id, [])
    
    def remove_queued_message(self, session_id: str, message_id: str):
        """Remove delivered message from queue"""
        if session_id in self.message_queues:
            self.message_queues[session_id] = [
                m for m in self.message_queues[session_id] if m.id != message_id
            ]
    
    def clear_queue(self, session_id: str):
        """Clear all queued messages"""
        if session_id in self.message_queues:
            del self.message_queues[session_id]
    
    def cleanup_session(self, session_id: str):
        """Clean up session data"""
        self.clear_queue(session_id)
