import logging
from fastapi import WebSocket
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class WebSocketLogger:
    """Logs WebSocket events for debugging production issues"""
    
    @staticmethod
    async def log_connection(session_id: str, client_host: str):
        logger.info(f"WS_CONNECT|{session_id}|{client_host}|{datetime.utcnow().isoformat()}")
    
    @staticmethod
    async def log_disconnection(session_id: str, client_host: str, code: int, reason: str):
        logger.info(f"WS_DISCONNECT|{session_id}|{client_host}|{code}|{reason}|{datetime.utcnow().isoformat()}")
    
    @staticmethod
    async def log_heartbeat_timeout(session_id: str, last_pong: float):
        logger.warning(f"WS_HEARTBEAT_TIMEOUT|{session_id}|{last_pong}|{datetime.utcnow().isoformat()}")
    
    @staticmethod
    async def log_reconnect(session_id: str, attempt: int):
        logger.info(f"WS_RECONNECT|{session_id}|attempt_{attempt}|{datetime.utcnow().isoformat()}")
