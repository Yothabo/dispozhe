from typing import Dict, List, Set
from collections import defaultdict
from ..models.QueuedMessage import QueuedMessage
import logging

logger = logging.getLogger(__name__)

class MessageStore:
    """Stores queued messages and message status"""
    
    def __init__(self):
        self.message_queues: Dict[str, List[QueuedMessage]] = defaultdict(list)
        self.message_status: Dict[str, Dict[str, str]] = defaultdict(dict)
        self.view_once_files: Dict[str, Dict] = {}
        self.viewed_files: Set[str] = set()
    
    def queue_message(self, session_id: str, message: QueuedMessage):
        """Add message to queue"""
        self.message_queues[session_id].append(message)
        logger.debug(f"Queued message {message.id} for session {session_id}")
    
    def get_queued_messages(self, session_id: str) -> List[QueuedMessage]:
        """Get all queued messages for a session"""
        return self.message_queues.get(session_id, [])
    
    def remove_queued_message(self, session_id: str, message_id: str):
        """Remove a message from queue"""
        if session_id in self.message_queues:
            self.message_queues[session_id] = [
                m for m in self.message_queues[session_id] if m.id != message_id
            ]
    
    def clear_queue(self, session_id: str):
        """Clear all queued messages for a session"""
        if session_id in self.message_queues:
            del self.message_queues[session_id]
    
    def add_view_once_file(self, file_id: str, file_data: Dict):
        """Add a view-once file"""
        self.view_once_files[file_id] = file_data
    
    def mark_file_viewed(self, file_id: str) -> bool:
        """Mark a file as viewed"""
        if file_id in self.view_once_files:
            self.viewed_files.add(file_id)
            del self.view_once_files[file_id]
            return True
        return False
    
    def cleanup_session(self, session_id: str):
        """Remove all data for a session"""
        self.clear_queue(session_id)
        if session_id in self.message_status:
            del self.message_status[session_id]
        
        # Clean up view-once files for this session
        to_delete = [fid for fid, data in self.view_once_files.items() 
                    if data.get('session_id') == session_id]
        for fid in to_delete:
            del self.view_once_files[fid]
