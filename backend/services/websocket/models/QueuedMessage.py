from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class QueuedMessage:
    """Represents a message waiting to be delivered"""
    id: str
    sender_id: str
    content: Dict
    timestamp: str
    retry_count: int = 0
    last_attempt: Optional[str] = None
    
    def increment_retry(self):
        self.retry_count += 1
