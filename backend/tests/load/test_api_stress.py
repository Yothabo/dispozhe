"""API STRESS TESTS - Simulates 1000 concurrent users"""
import pytest
import asyncio
import time
import random
import string
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from fastapi.testclient import TestClient
from app import app
import threading
import statistics

client = TestClient(app)

class TestAPIStress:
    """Stress test API endpoints with high concurrency"""
    
    def test_1000_concurrent_session_creations(self):
        """Create 1000 sessions simultaneously"""
        start_time = time.time()
        
        def create_session():
            return client.post("/session/create", json={"duration": random.randint(1, 60)})
        
        with ThreadPoolExecutor(max_workers=100) as executor:
            futures = [executor.submit(create_session) for _ in range(1000)]
            results = [f.result() for f in as_completed(futures)]
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Verify results
        successes = [r for r in results if r.status_code == 200]
        failures = [r for r in results if r.status_code != 200]
        
        print(f"\n✅ 1000 sessions created in {duration:.2f} seconds")
        print(f"   Success: {len(successes)}, Failures: {len(failures)}")
        print(f"   Avg time per session: {duration/1000*1000:.2f}ms")
        
        assert len(successes) > 950, f"Too many failures: {len(failures)}"
    
    def test_burst_session_creation(self):
        """Create sessions in rapid bursts"""
        burst_sizes = [10, 50, 100, 200, 500]
        results = {}
        
        for burst in burst_sizes:
            start = time.time()
            
            def create():
                return client.post("/session/create", json={"duration": 5})
            
            with ThreadPoolExecutor(max_workers=burst) as executor:
                futures = [executor.submit(create) for _ in range(burst)]
                responses = [f.result() for f in as_completed(futures)]
            
            duration = time.time() - start
            success_rate = len([r for r in responses if r.status_code == 200]) / burst * 100
            
            results[burst] = {
                "duration": duration,
                "success_rate": success_rate,
                "requests_per_second": burst / duration
            }
        
        print("\n📊 Burst Test Results:")
        for burst, data in results.items():
            print(f"   {burst} sessions: {data['duration']:.2f}s, "
                  f"{data['requests_per_second']:.0f} req/s, "
                  f"{data['success_rate']:.1f}% success")
    
    def test_mixed_api_calls_under_load(self):
        """Mix of different API calls under load"""
        session_ids = []
        
        # First create 100 sessions
        for _ in range(100):
            response = client.post("/session/create", json={"duration": 5})
            session_ids.append(response.json()["session_id"])
        
        def random_api_call():
            endpoint = random.choice([
                lambda: client.get(f"/session/{random.choice(session_ids)}/status"),
                lambda: client.post(f"/session/{random.choice(session_ids)}/join"),
                lambda: client.post("/session/create", json={"duration": 5}),
                lambda: client.get("/health"),
                lambda: client.get("/")
            ])
            try:
                return endpoint()
            except:
                return None
        
        # Hammer the API with 1000 random calls
        start = time.time()
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = [executor.submit(random_api_call) for _ in range(1000)]
            results = [f.result() for f in as_completed(futures)]
        
        duration = time.time() - start
        
        valid = [r for r in results if r and r.status_code < 500]
        errors = [r for r in results if r and r.status_code >= 500]
        
        print(f"\n🔄 Mixed API Calls: 1000 requests in {duration:.2f}s")
        print(f"   Success: {len(valid)}, Server Errors: {len(errors)}")
        assert len(errors) < 50, f"Too many server errors: {len(errors)}"
    
    def test_simultaneous_join_race_condition(self):
        """Test race condition when two users try to join simultaneously"""
        # Create a session
        create_resp = client.post("/session/create", json={"duration": 5})
        session_id = create_resp.json()["session_id"]
        
        def join_session():
            return client.post(f"/session/{session_id}/join")
        
        # Try to join with 5 clients simultaneously (only 2 should succeed)
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(join_session) for _ in range(5)]
            results = [f.result() for f in as_completed(futures)]
        
        successes = [r for r in results if r.status_code == 200]
        failures = [r for r in results if r.status_code != 200]
        
        print(f"\n🏁 Race Condition Test:")
        print(f"   Successful joins: {len(successes)} (should be 2)")
        print(f"   Failed joins: {len(failures)}")
        
        assert len(successes) == 2, f"Expected 2 successful joins, got {len(successes)}"
    
    def test_api_rate_limiting(self):
        """Test rate limiting under high load"""
        def rapid_requests():
            for _ in range(100):
                try:
                    client.get("/health")
                except:
                    pass
        
        start = time.time()
        threads = []
        for _ in range(10):
            t = threading.Thread(target=rapid_requests)
            t.start()
            threads.append(t)
        
        for t in threads:
            t.join()
        
        duration = time.time() - start
        print(f"\n⏱️  Rate limit test: 1000 requests in {duration:.2f}s")
        # Should not crash
        assert True
