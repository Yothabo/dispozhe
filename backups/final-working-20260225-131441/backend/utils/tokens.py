import secrets
import string

def generate_session_id(length: int = 8) -> str:
    """Generate a random session ID"""
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_security_token(length: int = 16) -> str:
    """Generate a random security token (not stored, used for future validation)"""
    return secrets.token_urlsafe(length)

def generate_encryption_key() -> str:
    """Generate a placeholder encryption key (client generates actual key)"""
    # Client generates the actual AES key - this is just for URL structure
    return secrets.token_urlsafe(16)
