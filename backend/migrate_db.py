#!/usr/bin/env python3
"""Database migration script for Day 4 features"""
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    """Add new columns to sessions table"""
    engine = create_engine('sqlite:///chatlly.db')
    
    with engine.connect() as conn:
        # Check if columns exist
        try:
            # Try to query the new columns
            result = conn.execute(text("SELECT session_metadata FROM sessions LIMIT 1"))
            logger.info("Columns already exist, skipping migration")
            return
        except OperationalError as e:
            if "no such column: session_metadata" in str(e):
                logger.info("Adding new columns to sessions table...")
                
                # Add new columns one by one
                try:
                    conn.execute(text("ALTER TABLE sessions ADD COLUMN started_at TIMESTAMP"))
                except OperationalError:
                    logger.info("Column started_at already exists")
                    
                try:
                    conn.execute(text("ALTER TABLE sessions ADD COLUMN participants JSON DEFAULT '[]'"))
                except OperationalError:
                    logger.info("Column participants already exists")
                    
                try:
                    conn.execute(text("ALTER TABLE sessions ADD COLUMN fingerprints JSON DEFAULT '{}'"))
                except OperationalError:
                    logger.info("Column fingerprints already exists")
                    
                try:
                    conn.execute(text("ALTER TABLE sessions ADD COLUMN session_metadata JSON DEFAULT '{}'"))
                except OperationalError:
                    logger.info("Column session_metadata already exists")
                    
                try:
                    conn.execute(text("ALTER TABLE sessions ADD COLUMN version VARCHAR DEFAULT '1.0.0'"))
                except OperationalError:
                    logger.info("Column version already exists")
                
                # Update existing records
                conn.execute(text("UPDATE sessions SET participants = '[]' WHERE participants IS NULL"))
                conn.execute(text("UPDATE sessions SET fingerprints = '{}' WHERE fingerprints IS NULL"))
                conn.execute(text("UPDATE sessions SET session_metadata = '{}' WHERE session_metadata IS NULL"))
                conn.execute(text("UPDATE sessions SET version = '1.0.0' WHERE version IS NULL"))
                
                conn.commit()
                logger.info("Migration completed successfully")
            else:
                logger.error(f"Unexpected error: {e}")
                raise

if __name__ == "__main__":
    migrate()
