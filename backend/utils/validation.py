import re
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

class InputValidator:
    """Validate and sanitize all user inputs"""
    
    @staticmethod
    def validate_session_id(session_id: str) -> bool:
        """Session IDs are 8 characters alphanumeric"""
        if not session_id or not isinstance(session_id, str):
            return False
        return bool(re.match(r'^[a-zA-Z0-9]{8}$', session_id))
    
    @staticmethod
    def validate_code(code: str) -> bool:
        """6-digit numeric code"""
        if not code or not isinstance(code, str):
            return False
        return bool(re.match(r'^\d{6}$', code))
    
    @staticmethod
    def sanitize_message(text: str) -> str:
        """Remove any potentially dangerous characters from messages"""
        if not isinstance(text, str):
            return ""
        
        # Allow only safe characters
        sanitized = re.sub(
            r'[^\w\s\.\,\!\?\-\:\;\'\"\(\)\[\]\{\}\@\#\$\%\&\*\<\>\=\+\/\~]', 
            '', 
            text
        )
        
        # Trim excessive length
        if len(sanitized) > 10000:
            sanitized = sanitized[:10000]
        
        return sanitized
    
    @staticmethod
    def validate_duration(duration: int) -> bool:
        """Duration between 1 and 1440 minutes"""
        if not isinstance(duration, int):
            return False
        return 1 <= duration <= 1440
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize uploaded filenames"""
        if not isinstance(filename, str):
            return "file"
        
        # Remove path separators and dangerous characters
        filename = re.sub(r'[\\/:"*?<>|]', '', filename)
        
        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            filename = name[:250] + ('.' + ext if ext else '')
        
        return filename or "file"

validator = InputValidator()
