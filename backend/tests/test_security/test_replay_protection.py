import pytest
import time
from datetime import datetime
from services.websocket.security.replay_protection import ReplayProtection

class TestReplayProtection:
    """Test suite for replay protection functionality."""
    
    def setup_method(self):
        """Set up fresh replay protection instance for each test."""
        self.protection = ReplayProtection(max_sequence_gap=10, nonce_expiry_seconds=1)
        self.session_id = "test_session_123"
        self.client_id = "test_client_456"
        self.secret_key = "test_secret_key"
    
    def test_initial_state(self):
        """Test that protection starts disabled."""
        assert self.protection.is_enabled() == False
        assert self.protection.enabled == False
    
    def test_enable_disable(self):
        """Test enabling and disabling protection."""
        self.protection.enable()
        assert self.protection.is_enabled() == True
        
        self.protection.disable()
        assert self.protection.is_enabled() == False
    
    def test_hmac_generation_and_verification(self):
        """Test HMAC generation and verification."""
        data = "encrypted_data_here"
        sequence = 1
        nonce = "unique_nonce_123"
        
        # Generate HMAC
        hmac = self.protection.generate_hmac(self.secret_key, data, sequence, nonce)
        assert isinstance(hmac, str)
        assert len(hmac) > 0
        
        # Verify correct HMAC
        assert self.protection.verify_hmac(self.secret_key, data, sequence, nonce, hmac) == True
        
        # Verify wrong HMAC fails
        wrong_hmac = "wrong_signature"
        assert self.protection.verify_hmac(self.secret_key, data, sequence, nonce, wrong_hmac) == False
    
    def test_sequence_validation_first_message(self):
        """Test first message sequence validation."""
        # First message should be accepted
        valid, reason = self.protection.validate_sequence(self.session_id, self.client_id, 1)
        assert valid == True
        assert reason == "first_message"
    
    def test_sequence_validation_increasing(self):
        """Test increasing sequence numbers."""
        # Send messages with increasing sequence
        valid, _ = self.protection.validate_sequence(self.session_id, self.client_id, 1)
        assert valid == True
        
        valid, _ = self.protection.validate_sequence(self.session_id, self.client_id, 2)
        assert valid == True
        
        valid, _ = self.protection.validate_sequence(self.session_id, self.client_id, 3)
        assert valid == True
    
    def test_sequence_validation_replay(self):
        """Test replay detection via sequence numbers."""
        self.protection.validate_sequence(self.session_id, self.client_id, 5)
        
        # Same sequence should be rejected
        valid, reason = self.protection.validate_sequence(self.session_id, self.client_id, 5)
        assert valid == False
        assert "sequence_too_old" in reason
        
        # Older sequence should be rejected
        valid, reason = self.protection.validate_sequence(self.session_id, self.client_id, 3)
        assert valid == False
        assert "sequence_too_old" in reason
    
    def test_sequence_validation_gap_too_large(self):
        """Test rejection of too-large sequence gaps."""
        self.protection.validate_sequence(self.session_id, self.client_id, 1)
        
        # Gap of 20 > max_sequence_gap=10 should be rejected
        valid, reason = self.protection.validate_sequence(self.session_id, self.client_id, 21)
        assert valid == False
        assert "sequence_gap_too_large" in reason
    
    def test_nonce_validation(self):
        """Test nonce uniqueness validation."""
        nonce = "unique_nonce_789"
        
        # First use should be accepted
        valid, reason = self.protection.validate_nonce(self.session_id, nonce)
        assert valid == True
        assert reason == "valid"
        
        # Same nonce should be rejected
        valid, reason = self.protection.validate_nonce(self.session_id, nonce)
        assert valid == False
        assert reason == "nonce_replayed"
    
    def test_nonce_expiry(self):
        """Test that nonces expire after timeout."""
        nonce = "expiring_nonce"
        
        # Add nonce
        self.protection.validate_nonce(self.session_id, nonce)
        
        # Wait for expiry
        time.sleep(1.1)
        
        # Cleanup should remove expired nonce
        self.protection._cleanup_old_nonces(self.session_id)
        
        # Same nonce should now be accepted again
        valid, reason = self.protection.validate_nonce(self.session_id, nonce)
        assert valid == True
        assert reason == "valid"
    
    def test_complete_message_validation(self):
        """Test complete message validation with all fields."""
        self.protection.enable()
        
        # Create valid message
        message = {
            "data": "encrypted_content",
            "sequence": 1,
            "nonce": "msg_nonce_1",
            "hmac": self.protection.generate_hmac(
                self.secret_key, 
                "encrypted_content", 
                1, 
                "msg_nonce_1"
            )
        }
        
        # Valid message should pass
        valid, reason = self.protection.validate_message(
            self.session_id, 
            self.client_id, 
            message,
            self.secret_key
        )
        assert valid == True
        assert reason == "valid"
        
        # Replay same message should fail
        valid, reason = self.protection.validate_message(
            self.session_id, 
            self.client_id, 
            message,
            self.secret_key
        )
        assert valid == False
        assert "nonce_replayed" in reason or "sequence_too_old" in reason
    
    def test_missing_fields(self):
        """Test rejection of messages with missing security fields."""
        self.protection.enable()
        
        # Missing sequence
        message = {"data": "content", "nonce": "n1"}
        valid, reason = self.protection.validate_message(
            self.session_id, self.client_id, message
        )
        assert valid == False
        assert reason == "missing_sequence"
        
        # Missing nonce
        message = {"data": "content", "sequence": 1}
        valid, reason = self.protection.validate_message(
            self.session_id, self.client_id, message
        )
        assert valid == False
        assert reason == "missing_nonce"
        
        # Missing HMAC (when secret provided)
        message = {"data": "content", "sequence": 1, "nonce": "n1"}
        valid, reason = self.protection.validate_message(
            self.session_id, self.client_id, message, self.secret_key
        )
        assert valid == False
        assert reason == "missing_hmac"
    
    def test_disabled_protection(self):
        """Test that validation passes when protection is disabled."""
        self.protection.disable()
        
        # Even invalid messages should pass when disabled
        message = {"data": "content"}  # Missing required fields
        valid, reason = self.protection.validate_message(
            self.session_id, self.client_id, message
        )
        assert valid == True
        assert reason == "protection_disabled"
    
    def test_cleanup_session(self):
        """Test session cleanup removes all tracking data."""
        # Add some data
        self.protection.validate_sequence(self.session_id, self.client_id, 1)
        self.protection.validate_nonce(self.session_id, "test_nonce")
        
        # Verify data exists
        assert self.session_id in self.protection.sequences
        assert self.session_id in self.protection.seen_nonces
        
        # Clean up
        self.protection.cleanup_session(self.session_id)
        
        # Verify data removed
        assert self.session_id not in self.protection.sequences
        assert self.session_id not in self.protection.seen_nonces
    
    def test_get_stats(self):
        """Test statistics reporting."""
        # Add some data
        self.protection.validate_sequence(self.session_id, self.client_id, 1)
        self.protection.validate_nonce(self.session_id, "nonce1")
        self.protection.validate_nonce(self.session_id, "nonce2")
        
        # Get global stats
        stats = self.protection.get_stats()
        assert stats['total_sessions'] >= 1
        assert stats['total_nonces'] >= 2
        
        # Get session-specific stats
        session_stats = self.protection.get_stats(self.session_id)
        assert session_stats['session_id'] == self.session_id
        assert session_stats['nonce_count'] >= 2
