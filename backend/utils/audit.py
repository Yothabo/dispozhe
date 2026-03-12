import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Configure audit logger
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Ensure audit logs go to a separate file
try:
    handler = logging.FileHandler('audit.log')
    handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
    audit_logger.addHandler(handler)
except Exception as e:
    print(f"Could not set up audit file: {e}")

class AuditLogger:
    """Security audit logging for all sensitive operations"""
    
    @staticmethod
    def log_event(
        event_type: str, 
        session_id: str, 
        user_ip: str, 
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log a security event"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": event_type,
            "session_id": session_id,
            "ip": user_ip,
            "user_id": user_id,
            "details": details or {}
        }
        audit_logger.info(json.dumps(log_entry))
    
    @staticmethod
    def log_session_created(session_id: str, user_ip: str, duration: int):
        """Log session creation"""
        AuditLogger.log_event(
            "session_created", 
            session_id, 
            user_ip, 
            details={"duration": duration}
        )
    
    @staticmethod
    def log_session_joined(session_id: str, user_ip: str, via_code: bool = False):
        """Log user joining session"""
        AuditLogger.log_event(
            "session_joined", 
            session_id, 
            user_ip, 
            details={"via_code": via_code}
        )
    
    @staticmethod
    def log_termination(session_id: str, user_ip: str, initiator: str):
        """Log session termination"""
        AuditLogger.log_event(
            "session_terminated", 
            session_id, 
            user_ip, 
            details={"initiator": initiator}
        )
    
    @staticmethod
    def log_auth_failure(session_id: str, user_ip: str, reason: str):
        """Log authentication failure"""
        AuditLogger.log_event(
            "auth_failure", 
            session_id, 
            user_ip, 
            details={"reason": reason}
        )
    
    @staticmethod
    def log_suspicious_activity(session_id: str, user_ip: str, activity: str):
        """Log suspicious activity"""
        AuditLogger.log_event(
            "suspicious", 
            session_id, 
            user_ip, 
            details={"activity": activity}
        )

audit = AuditLogger()
