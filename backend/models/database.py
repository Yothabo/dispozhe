from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import os
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chatlly.db")

# Increased pool size for stress tests
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    pool_size=50,  # Increased from default 5
    max_overflow=100,  # Increased from default 10
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    participant_count = Column(Integer, default=1)
    status = Column(String, default="waiting")
    link_active = Column(Boolean, default=True)
    terminated_at = Column(DateTime, nullable=True)
    chat_started_at = Column(DateTime, nullable=True)
    total_extensions = Column(Integer, default=0)

    def time_left(self) -> int:
        if self.status == "terminated":
            return 0
        if self.chat_started_at and datetime.utcnow() >= self.expires_at:
            return 0
        if not self.chat_started_at:
            return self.duration_minutes * 60
        return int((self.expires_at - datetime.utcnow()).total_seconds())

    def extend_time(self, minutes: int) -> datetime:
        self.expires_at = self.expires_at + timedelta(minutes=minutes)
        return self.expires_at

def init_db():
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
