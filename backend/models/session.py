from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

Base = declarative_base()

class DBSession(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime)
    expires_at = Column(DateTime)
    duration_minutes = Column(Integer)
    participant_count = Column(Integer, default=0)
    status = Column(String, default="waiting")  # waiting, active, expired, terminated
    link_active = Column(Boolean, default=True)
    terminated_at = Column(DateTime, nullable=True)
    chat_started_at = Column(DateTime, nullable=True)  # When both users connected
    total_extensions = Column(Integer, default=0)

    def time_left(self):
        if not self.chat_started_at or self.status != "active":
            return self.duration_minutes * 60
        remaining = (self.expires_at - datetime.utcnow()).total_seconds()
        return max(0, int(remaining))

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
    chat_started_at: Optional[datetime] = None
