from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chatlly.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
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
    status = Column(String, default="waiting")  # waiting, active, expired, terminated
    link_active = Column(Boolean, default=True)
    terminated_at = Column(DateTime, nullable=True)  # Add this column

    def to_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "duration_minutes": self.duration_minutes,
            "participant_count": self.participant_count,
            "status": self.status,
            "link_active": self.link_active,
            "terminated_at": self.terminated_at.isoformat() if self.terminated_at else None
        }
    
    def time_left(self) -> int:
        """Calculate time left in seconds"""
        if self.status == "terminated":
            return 0
        if datetime.utcnow() >= self.expires_at:
            return 0
        return int((self.expires_at - datetime.utcnow()).total_seconds())

# Create tables (this will add the new column)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
