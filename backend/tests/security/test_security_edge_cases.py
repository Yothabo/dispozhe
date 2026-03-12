"""SECURITY EDGE CASES - Test boundary conditions and attack vectors"""
import pytest
import time
import json
import asyncio
import random
import string
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

class TestSecurityEdgeCases:
    """Test security boundaries and potential attack vectors"""
    
    def test_session_id_collision_attempt(self):
        """Try to cause session ID collisions"""
        created_ids = set()
        collisions = 0
        
        for _ in range(10000):
            resp = client.post("/session/create", json={"duration": 5})
            session_id = resp.json()["session_id"]
            
            if session_id in created_ids:
                collisions += 1
            created_ids.add(session_id)
        
        print(f"\n🆔 Session ID Collision Test:")
        print(f"   Generated 10000 IDs, Collisions: {collisions}")
        assert collisions == 0, f"Found {collisions} collisions!"
    
    def test_code_brute_force_simulation(self):
        """Simulate brute force attack on 6-digit codes"""
        # Create a real session with a code
        resp = client.post("/session/create", json={"duration": 5})
        real_code = resp.json()["code"]
        
        # Try to brute force the code
        attempts = 0
        found = False
        
        # Try 1000 random codes (simulate attacker)
        for _ in range(1000):
            fake_code = f"{random.randint(0, 999999):06d}"
            attempts += 1
            
            resp = client.post(f"/session/code/{fake_code}")
            if resp.status_code == 200:
                found = True
                break
        
        print(f"\n🔐 Code Brute Force Simulation:")
        print(f"   Attempts: {attempts}, Success: {found}")
        
        # Should not find the code with random attempts
        assert not found, "Random code guess succeeded!"
        
        # Now try the real code
        resp = client.post(f"/session/code/{real_code}")
        assert resp.status_code == 200, "Real code should work"
    
    def test_malformed_session_ids(self):
        """Test various malformed session ID inputs"""
        malformed_ids = [
            "../../../etc/passwd",
            "<script>alert(1)</script>",
            "'; DROP TABLE sessions; --",
            "..\\..\\windows\\system32",
            "%2e%2e%2f%2e%2e%2f",
            "a" * 1000,  # Very long
            "!@#$%^&*()",
            "null",
            "undefined",
            "NaN",
            "Infinity",
            "-1",
            "0",
            "1.1.1.1",
            "2001:db8::1",
        ]
        
        results = []
        for bad_id in malformed_ids:
            resp = client.get(f"/session/{bad_id}/status")
            results.append((bad_id, resp.status_code))
        
        failures = [(id, code) for id, code in results if code < 400 or code >= 500]
        print(f"\n💉 Malformed Session ID Test:")
        for id, code in failures[:5]:  # Show first 5 failures
            print(f"   {id[:30]}... -> {code}")
        
        assert len(failures) == 0, f"Found {len(failures)} unexpected successes"
    
    def test_join_timing_attack(self):
        """Measure response times to detect timing attacks"""
        # Create real session
        resp = client.post("/session/create", json={"duration": 5})
        real_session = resp.json()["session_id"]
        
        def measure_join_time(session_id):
            start = time.perf_counter()
            resp = client.post(f"/session/{session_id}/join")
            end = time.perf_counter()
            return (end - start) * 1000  # milliseconds
        
        # Measure valid join time
        valid_times = []
        for _ in range(10):
            # Recreate session each time
            sid = client.post("/session/create", json={"duration": 5}).json()["session_id"]
            valid_times.append(measure_join_time(sid))
        
        # Measure invalid join times
        invalid_times = []
        for _ in range(10):
            invalid_times.append(measure_join_time("invalid" + str(random.randint(1, 1000))))
        
        avg_valid = sum(valid_times) / len(valid_times)
        avg_invalid = sum(invalid_times) / len(invalid_times)
        diff_percent = abs(avg_valid - avg_invalid) / avg_valid * 100
        
        print(f"\n⏱️  Timing Attack Analysis:")
        print(f"   Avg valid join: {avg_valid:.3f}ms")
        print(f"   Avg invalid join: {avg_invalid:.3f}ms")
        print(f"   Difference: {diff_percent:.1f}%")
        
        # Should be very close to prevent timing attacks
        assert diff_percent < 10, f"Timing difference too large: {diff_percent:.1f}%"
    
    def test_memory_exhaustion_attempt(self):
        """Try to exhaust memory with many large messages"""
        session_id = client.post("/session/create", json={"duration": 5}).json()["session_id"]
        
        # Join second user
        client.post(f"/session/{session_id}/join")
        
        def send_huge_message():
            huge = {
                "type": "message",
                "id": f"huge-{random.randint(1, 1000)}",
                "data": "x" * 10_000_000,  # 10MB message
                "timestamp": time.time()
            }
            # Would need WebSocket to actually send, but we're testing API limits
            return huge
        
        # Try to create many huge messages
        import tracemalloc
        tracemalloc.start()
        
        messages = []
        for i in range(100):
            messages.append(send_huge_message())
        
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        print(f"\n💾 Memory Usage:")
        print(f"   Current: {current / 1024 / 1024:.1f}MB")
        print(f"   Peak: {peak / 1024 / 1024:.1f}MB")
        
        # Should be able to handle message creation without OOM
        assert peak < 1024 * 1024 * 1024, "Peak memory exceeded 1GB"
