from dataclasses import dataclass

@dataclass
class ExpiryConfig:
    """Configuration for expiry service"""
    check_interval_seconds: int = 60
    min_session_age_seconds: int = 60  # Don't expire sessions younger than this
    cleanup_batch_size: int = 100
