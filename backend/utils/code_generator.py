import hashlib
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class CodeEntry:
    def __init__(self, session_id: str, encryption_key: str, expires_at: datetime):
        self.session_id = session_id
        self.encryption_key = encryption_key
        self.created_at = datetime.utcnow()
        self.expires_at = expires_at
        self.used = False

class CodeGenerator:
    def __init__(self):
        self.active_codes: Dict[str, CodeEntry] = {}
        self.session_to_code: Dict[str, str] = {}
        self.lock = threading.Lock()
        
    def _generate_six_digit_code(self, session_id: str) -> str:
        hash_obj = hashlib.sha256(session_id.encode())
        hash_int = int.from_bytes(hash_obj.digest(), byteorder='big')
        code_int = hash_int % 1_000_000
        return f"{code_int:06d}"
    
    def _ensure_unique_code(self, base_code: str, session_id: str) -> str:
        code = base_code
        offset = 0
        
        while code in self.active_codes and self.active_codes[code].session_id != session_id:
            offset += 1
            if offset > 100:
                code_int = (int(base_code) + offset) % 1_000_000
                code = f"{code_int:06d}"
            else:
                code_int = (int(base_code) + offset) % 1_000_000
                code = f"{code_int:06d}"
        
        return code
    
    def generate_code(self, session_id: str, expires_at: datetime, encryption_key: str = "") -> str:
        with self.lock:
            if session_id in self.session_to_code:
                old_code = self.session_to_code[session_id]
                if old_code in self.active_codes:
                    del self.active_codes[old_code]
                del self.session_to_code[session_id]
            
            base_code = self._generate_six_digit_code(session_id)
            code = self._ensure_unique_code(base_code, session_id)
            
            self.active_codes[code] = CodeEntry(session_id, encryption_key, expires_at)
            self.session_to_code[session_id] = code
            
            logger.info(f"Generated code {code} for session {session_id}")
            return code
    
    def redeem_code(self, code: str) -> Optional[Dict[str, str]]:
        with self.lock:
            entry = self.active_codes.get(code)
            
            if not entry:
                logger.info(f"Code {code} not found")
                return None
            
            if entry.used:
                logger.info(f"Code {code} already used")
                return None
            
            if datetime.utcnow() > entry.expires_at:
                logger.info(f"Code {code} expired")
                self._cleanup_code(code, entry.session_id)
                return None
            
            entry.used = True
            
            result = {
                "sessionId": entry.session_id,
                "encryptionKey": entry.encryption_key
            }
            
            self._cleanup_code(code, entry.session_id)
            
            logger.info(f"Code {code} redeemed successfully for session {entry.session_id}")
            return result
    
    def _cleanup_code(self, code: str, session_id: str):
        if code in self.active_codes:
            del self.active_codes[code]
        if session_id in self.session_to_code:
            del self.session_to_code[session_id]
    
    def remove_by_session(self, session_id: str):
        with self.lock:
            if session_id in self.session_to_code:
                code = self.session_to_code[session_id]
                self._cleanup_code(code, session_id)
                logger.info(f"Removed code {code} for session {session_id}")
    
    def cleanup_expired(self):
        with self.lock:
            now = datetime.utcnow()
            expired = [
                code for code, entry in self.active_codes.items()
                if entry.expires_at < now
            ]
            for code in expired:
                entry = self.active_codes[code]
                self._cleanup_code(code, entry.session_id)
            
            if expired:
                logger.info(f"Cleaned up {len(expired)} expired codes")
