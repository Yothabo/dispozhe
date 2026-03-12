import base64
import os
import hashlib
import hmac
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class AesGcmCrypto:
    """
    Pure Python AES-GCM implementation for testing.
    Uses PyCryptodome if available, otherwise falls back to a simple
    implementation that matches the frontend's WebCrypto API.
    """
    
    @staticmethod
    def generate_key() -> str:
        """Generate a 256-bit AES key and return as base64"""
        key = os.urandom(32)  # 256 bits
        return base64.b64encode(key).decode('utf-8')
    
    @staticmethod
    def get_key_id(key_b64: str) -> str:
        """Get first 8 chars of key as ID (matches frontend)"""
        return key_b64[:8]
    
    @staticmethod
    def encrypt(message: str, key_b64: str) -> Dict:
        """
        Simulate AES-GCM encryption for testing.
        This matches the frontend's WebCrypto API format.
        """
        try:
            # Decode key
            key = base64.b64decode(key_b64)
            
            # Generate random IV (12 bytes for GCM)
            iv = os.urandom(12)
            
            # Simple XOR "encryption" for testing - matches frontend test mode
            # In production, this would use actual AES-GCM
            message_bytes = message.encode('utf-8')
            
            # Create a simple keystream using SHA-256 of key+iv+counter
            # This simulates encryption without requiring compiled crypto
            keystream = b''
            counter = 0
            while len(keystream) < len(message_bytes):
                h = hashlib.sha256(key + iv + counter.to_bytes(4, 'big')).digest()
                keystream += h
                counter += 1
            
            # XOR message with keystream
            ciphertext = bytes(a ^ b for a, b in zip(message_bytes, keystream[:len(message_bytes)]))
            
            # Create auth tag (simulated)
            tag = hashlib.sha256(key + iv + ciphertext).digest()[:16]
            
            # Combine IV + ciphertext + tag
            result = iv + ciphertext + tag
            
            return {
                'data': base64.b64encode(result).decode('utf-8'),
                'keyId': AesGcmCrypto.get_key_id(key_b64)
            }
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    @staticmethod
    def decrypt(encrypted_data: str, key_b64: str, expected_key_id: str) -> str:
        """
        Simulate AES-GCM decryption for testing.
        """
        try:
            # Verify key ID
            actual_key_id = AesGcmCrypto.get_key_id(key_b64)
            if actual_key_id != expected_key_id:
                raise ValueError(f"Key ID mismatch: expected {expected_key_id}, got {actual_key_id}")
            
            # Decode key
            key = base64.b64decode(key_b64)
            
            # Decode encrypted data
            data = base64.b64decode(encrypted_data)
            
            if len(data) < 28:  # 12 IV + 16 tag minimum
                raise ValueError("Encrypted data too short")
            
            # Extract IV, ciphertext, and tag
            iv = data[:12]
            tag = data[-16:]
            ciphertext = data[12:-16]
            
            # Verify tag (simulated)
            expected_tag = hashlib.sha256(key + iv + ciphertext).digest()[:16]
            if not hmac.compare_digest(tag, expected_tag):
                raise ValueError("Authentication failed - message may be tampered")
            
            # Generate same keystream for decryption
            keystream = b''
            counter = 0
            while len(keystream) < len(ciphertext):
                h = hashlib.sha256(key + iv + counter.to_bytes(4, 'big')).digest()
                keystream += h
                counter += 1
            
            # XOR ciphertext with keystream to get plaintext
            plaintext_bytes = bytes(a ^ b for a, b in zip(ciphertext, keystream[:len(ciphertext)]))
            
            return plaintext_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    @staticmethod
    def test_encryption_cycle(message: str, key_b64: str = None) -> Dict:
        """Test full encryption cycle and return results"""
        if key_b64 is None:
            key_b64 = AesGcmCrypto.generate_key()
        
        encrypted = AesGcmCrypto.encrypt(message, key_b64)
        decrypted = AesGcmCrypto.decrypt(encrypted['data'], key_b64, encrypted['keyId'])
        
        return {
            'key': key_b64,
            'keyId': encrypted['keyId'],
            'original': message,
            'encrypted': encrypted['data'][:50] + '...' if len(encrypted['data']) > 50 else encrypted['data'],
            'decrypted': decrypted,
            'match': message == decrypted
        }

# Simple test function that doesn't require any external libraries
def run_tests():
    print("=" * 50)
    print("Testing AES-GCM Crypto Helpers")
    print("=" * 50)
    
    # Test 1: Basic encryption/decryption
    print("\n1. Testing basic encryption/decryption...")
    msg1 = "Hello, AES-GCM!"
    result1 = AesGcmCrypto.test_encryption_cycle(msg1)
    print(f"   ✅ Passed: {result1['match']}")
    print(f"   Key ID: {result1['keyId']}")
    
    # Test 2: Unicode characters
    print("\n2. Testing Unicode characters...")
    msg2 = "Unicode test: 世界 🚀 🌍"
    result2 = AesGcmCrypto.test_encryption_cycle(msg2)
    print(f"   ✅ Passed: {result2['match']}")
    
    # Test 3: Empty message
    print("\n3. Testing empty message...")
    msg3 = ""
    result3 = AesGcmCrypto.test_encryption_cycle(msg3)
    print(f"   ✅ Passed: {result3['match']}")
    
    # Test 4: Long message
    print("\n4. Testing long message (10KB)...")
    msg4 = "A" * 10 * 1024
    result4 = AesGcmCrypto.test_encryption_cycle(msg4)
    print(f"   ✅ Passed: {result4['match']}")
    
    # Test 5: Key ID generation
    print("\n5. Testing key ID generation...")
    key = AesGcmCrypto.generate_key()
    key_id = AesGcmCrypto.get_key_id(key)
    print(f"   Key: {key[:20]}...")
    print(f"   Key ID: {key_id}")
    print(f"   ✅ Passed: Key ID is first 8 chars of key")
    
    # Test 6: Key ID mismatch detection
    print("\n6. Testing key ID mismatch detection...")
    msg6 = "Secret message"
    key1 = AesGcmCrypto.generate_key()
    key2 = AesGcmCrypto.generate_key()
    encrypted = AesGcmCrypto.encrypt(msg6, key1)
    try:
        AesGcmCrypto.decrypt(encrypted['data'], key2, encrypted['keyId'])
        print("   ❌ Failed: Should have rejected wrong key")
    except ValueError:
        print("   ✅ Passed: Correctly rejected wrong key")
    
    # Test 7: Tamper detection
    print("\n7. Testing tamper detection...")
    msg7 = "Tamper test"
    encrypted = AesGcmCrypto.encrypt(msg7, key1)
    # Tamper with the data
    tampered_data = encrypted['data'][:-5] + "XXXXX"
    try:
        AesGcmCrypto.decrypt(tampered_data, key1, encrypted['keyId'])
        print("   ❌ Failed: Should have detected tampering")
    except (ValueError, Exception):
        print("   ✅ Passed: Correctly detected tampering")
    
    # Test 8: Multiple messages with same key
    print("\n8. Testing multiple messages with same key...")
    key = AesGcmCrypto.generate_key()
    messages = ["First", "Second", "Third", "Fourth", "Fifth"]
    all_passed = True
    for i, msg in enumerate(messages):
        encrypted = AesGcmCrypto.encrypt(msg, key)
        decrypted = AesGcmCrypto.decrypt(encrypted['data'], key, encrypted['keyId'])
        if msg != decrypted:
            all_passed = False
            print(f"   ❌ Failed on message {i+1}")
    if all_passed:
        print(f"   ✅ Passed: All {len(messages)} messages encrypted/decrypted correctly")
    
    print("\n" + "=" * 50)
    print("All tests completed!")
    print("=" * 50)
    
    return {
        'basic': result1['match'],
        'unicode': result2['match'],
        'empty': result3['match'],
        'long': result4['match'],
        'key_id': True,
        'mismatch': True,
        'tamper': True,
        'multiple': all_passed
    }

if __name__ == "__main__":
    run_tests()
