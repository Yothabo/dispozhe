import hmac
import hashlib
import logging
import time
from typing import Dict, Set, Optional, Tuple
from collections import deque
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ReplayProtection:
    """
    In-memory replay protection for WebSocket messages.
    Tracks sequence numbers and nonces per session to prevent replay attacks.
    No database persistence - all data is ephemeral and cleared on session end.
    """
    
    def __init__(self, max_sequence_gap: int = 100, nonce_expiry_seconds: int = 300):
        """
        Initialize replay protection with configurable parameters.
        
        Args:
            max_sequence_gap: Maximum allowed gap in sequence numbers
            nonce_expiry_seconds: How long to keep nonces in memory (seconds)
        """
        self.max_sequence_gap = max_sequence_gap
        self.nonce_expiry_seconds = nonce_expiry_seconds
        
        # Track last sequence number per session per client
        # Format: {session_id: {client_id: last_sequence}}
        self.sequences: Dict[str, Dict[str, int]] = {}
        
        # Track seen nonces per session with timestamps
        # Format: {session_id: {nonce: timestamp}}
        self.seen_nonces: Dict[str, Dict[str, float]] = {}
        
        # Feature flag - starts disabled for safe rollout
        self.enabled = False
        
        logger.info("[ReplayProtection] Initialized (disabled by default)")
    
    def enable(self) -> None:
        """Enable replay protection - can be called at runtime"""
        self.enabled = True
        logger.info("[ReplayProtection] ENABLED")
    
    def disable(self) -> None:
        """Disable replay protection - instant rollback capability"""
        self.enabled = False
        logger.info("[ReplayProtection] DISABLED")
    
    def is_enabled(self) -> bool:
        """Check if replay protection is currently enabled"""
        return self.enabled
    
    def generate_hmac(self, secret_key: str, data: str, sequence: int, nonce: str) -> str:
        """
        Generate HMAC-SHA256 signature for message integrity.
        
        Args:
            secret_key: Session secret key
            data: Encrypted message data
            sequence: Message sequence number
            nonce: Unique nonce
            
        Returns:
            Hex digest of HMAC
        """
        message = f"{data}:{sequence}:{nonce}".encode('utf-8')
        signature = hmac.new(
            secret_key.encode('utf-8'),
            message,
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def verify_hmac(self, secret_key: str, data: str, sequence: int, nonce: str, received_hmac: str) -> bool:
        """
        Verify HMAC signature matches expected value.
        
        Args:
            secret_key: Session secret key
            data: Encrypted message data
            sequence: Message sequence number
            nonce: Unique nonce
            received_hmac: HMAC received with message
            
        Returns:
            True if HMAC is valid, False otherwise
        """
        expected = self.generate_hmac(secret_key, data, sequence, nonce)
        return hmac.compare_digest(expected, received_hmac)
    
    def _cleanup_old_nonces(self, session_id: str) -> None:
        """
        Remove nonces older than expiry window to prevent memory leaks.
        
        Args:
            session_id: Session to clean up
        """
        if session_id not in self.seen_nonces:
            return
        
        now = time.time()
        expiry_threshold = now - self.nonce_expiry_seconds
        
        # Keep only nonces within expiry window
        self.seen_nonces[session_id] = {
            nonce: timestamp 
            for nonce, timestamp in self.seen_nonces[session_id].items()
            if timestamp > expiry_threshold
        }
    
    def validate_sequence(self, session_id: str, client_id: str, sequence: int) -> Tuple[bool, str]:
        """
        Validate message sequence number.
        
        Args:
            session_id: Session identifier
            client_id: Client identifier
            sequence: Message sequence number
            
        Returns:
            Tuple of (is_valid, reason)
        """
        # Initialize session tracking if needed
        if session_id not in self.sequences:
            self.sequences[session_id] = {}
        
        # First message from this client
        if client_id not in self.sequences[session_id]:
            self.sequences[session_id][client_id] = sequence
            return True, "first_message"
        
        last_seq = self.sequences[session_id][client_id]
        
        # Check for replay (sequence <= last seen)
        if sequence <= last_seq:
            return False, f"sequence_too_old (got {sequence}, last {last_seq})"
        
        # Check for excessive gap (possible missing messages)
        if sequence > last_seq + self.max_sequence_gap:
            return False, f"sequence_gap_too_large (got {sequence}, last {last_seq})"
        
        # Update last sequence
        self.sequences[session_id][client_id] = sequence
        return True, "valid"
    
    def validate_nonce(self, session_id: str, nonce: str) -> Tuple[bool, str]:
        """
        Validate nonce hasn't been seen before.
        
        Args:
            session_id: Session identifier
            nonce: Message nonce
            
        Returns:
            Tuple of (is_valid, reason)
        """
        # Initialize nonce tracking if needed
        if session_id not in self.seen_nonces:
            self.seen_nonces[session_id] = {}
        
        # Clean up old nonces
        self._cleanup_old_nonces(session_id)
        
        # Check for replay
        if nonce in self.seen_nonces[session_id]:
            return False, "nonce_replayed"
        
        # Store nonce with current timestamp
        self.seen_nonces[session_id][nonce] = time.time()
        return True, "valid"
    
    def validate_message(self, session_id: str, client_id: str, message_data: dict, secret_key: str = None) -> Tuple[bool, str]:
        """
        Complete message validation including sequence, nonce, and HMAC.
        
        Args:
            session_id: Session identifier
            client_id: Client identifier
            message_data: Complete message dictionary
            secret_key: Optional secret key for HMAC verification
            
        Returns:
            Tuple of (is_valid, reason)
        """
        # Skip validation if protection is disabled
        if not self.enabled:
            return True, "protection_disabled"
        
        # Check for required security fields
        if 'sequence' not in message_data:
            return False, "missing_sequence"
        if 'nonce' not in message_data:
            return False, "missing_nonce"
        
        sequence = message_data['sequence']
        nonce = message_data['nonce']
        
        # Validate sequence number
        seq_valid, seq_reason = self.validate_sequence(session_id, client_id, sequence)
        if not seq_valid:
            return False, seq_reason
        
        # Validate nonce
        nonce_valid, nonce_reason = self.validate_nonce(session_id, nonce)
        if not nonce_valid:
            return False, nonce_reason
        
        # Validate HMAC if secret key provided
        if secret_key and 'hmac' in message_data:
            data = message_data.get('data', '')
            received_hmac = message_data['hmac']
            
            if not self.verify_hmac(secret_key, data, sequence, nonce, received_hmac):
                return False, "hmac_invalid"
        elif secret_key and 'hmac' not in message_data:
            return False, "missing_hmac"
        
        return True, "valid"
    
    def cleanup_session(self, session_id: str) -> None:
        """
        Remove all tracking data for a completed session.
        
        Args:
            session_id: Session to clean up
        """
        if session_id in self.sequences:
            del self.sequences[session_id]
        
        if session_id in self.seen_nonces:
            del self.seen_nonces[session_id]
        
        logger.info(f"[ReplayProtection] Cleaned up session {session_id}")
    
    def get_stats(self, session_id: str = None) -> dict:
        """
        Get statistics about current tracking state.
        
        Args:
            session_id: Optional specific session
            
        Returns:
            Dictionary with statistics
        """
        if session_id:
            return {
                'session_id': session_id,
                'sequence_count': len(self.sequences.get(session_id, {})),
                'nonce_count': len(self.seen_nonces.get(session_id, {})),
                'enabled': self.enabled
            }
        
        return {
            'total_sessions': len(self.sequences),
            'total_nonces': sum(len(nonces) for nonces in self.seen_nonces.values()),
            'enabled': self.enabled,
            'config': {
                'max_sequence_gap': self.max_sequence_gap,
                'nonce_expiry_seconds': self.nonce_expiry_seconds
            }
        }
