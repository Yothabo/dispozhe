#!/usr/bin/env python3
"""Fix database by removing the problematic metadata column"""
import sqlite3
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_database():
    """Remove metadata column from sessions table"""
    conn = sqlite3.connect('chatlly.db')
    cursor = conn.cursor()
    
    # Check if metadata column exists
    cursor.execute("PRAGMA table_info(sessions)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    
    if 'metadata' not in column_names:
        logger.info("metadata column doesn't exist, nothing to fix")
        conn.close()
        return
    
    logger.info("Found metadata column, removing it...")
    
    # Create new table without metadata column
    cursor.execute('''
        CREATE TABLE sessions_new (
            id VARCHAR NOT NULL,
            created_at DATETIME,
            expires_at DATETIME NOT NULL,
            duration_minutes INTEGER NOT NULL,
            participant_count INTEGER,
            status VARCHAR,
            link_active BOOLEAN,
            terminated_at DATETIME,
            chat_started_at DATETIME,
            total_extensions INTEGER DEFAULT 0,
            started_at TIMESTAMP,
            participants JSON DEFAULT '[]',
            fingerprints JSON DEFAULT '{}',
            version VARCHAR DEFAULT '1.0.0',
            session_metadata JSON DEFAULT '{}',
            PRIMARY KEY (id)
        )
    ''')
    
    # Copy data from old table to new table (excluding metadata)
    cursor.execute('''
        INSERT INTO sessions_new (
            id, created_at, expires_at, duration_minutes, participant_count,
            status, link_active, terminated_at, chat_started_at, total_extensions,
            started_at, participants, fingerprints, version, session_metadata
        )
        SELECT 
            id, created_at, expires_at, duration_minutes, participant_count,
            status, link_active, terminated_at, chat_started_at, total_extensions,
            started_at, participants, fingerprints, version, session_metadata
        FROM sessions
    ''')
    
    # Drop old table and rename new one
    cursor.execute("DROP TABLE sessions")
    cursor.execute("ALTER TABLE sessions_new RENAME TO sessions")
    
    # Recreate index
    cursor.execute("CREATE INDEX ix_sessions_id ON sessions (id)")
    
    conn.commit()
    conn.close()
    logger.info("Database fixed successfully - removed metadata column")

if __name__ == "__main__":
    fix_database()
