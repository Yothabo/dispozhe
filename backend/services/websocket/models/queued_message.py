from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class QueuedMessage:
    """Message waiting for delivery"""
    id: str
    sender_id: str
    content: Dict
    timestamp: str
    retry_count: int = 0
    last_attempt: Optional[str] = None
