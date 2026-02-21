from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SessionCreate(BaseModel):
    duration: int

class SessionResponse(BaseModel):
    session_id: str
    duration: int
    expires_at: datetime
    link: str
    status: str
    code: Optional[str] = None
    time_left_seconds: Optional[int] = None

class SessionExtend(BaseModel):
    minutes: int

class SessionStatus(BaseModel):
    session_id: str
    participant_count: int
    status: str
    expires_at: datetime
    time_left_seconds: int
    created_at: Optional[datetime] = None
