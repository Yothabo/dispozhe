import requests
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:8000"

def test_burst_creations():
    """Test creating sessions in bursts against real server"""
    burst_sizes = [10, 50, 100]
    
    for burst in burst_sizes:
        start = time.time()
        successes = 0
        
        def create_session():
            try:
                resp = requests.post(
                    f"{BASE_URL}/session/create", 
                    json={"duration": 5},
                    timeout=5
                )
                return resp.status_code == 200
            except:
                return False
        
        with ThreadPoolExecutor(max_workers=burst) as executor:
            futures = [executor.submit(create_session) for _ in range(burst)]
            for future in as_completed(futures):
                if future.result():
                    successes += 1
        
        duration = time.time() - start
        rate = successes / duration
        print(f"Burst {burst}: {successes}/{burst} success, {duration:.2f}s, {rate:.0f} req/s")

def test_mixed_calls():
    """Test mixed API calls against real server"""
    # First create some sessions
    session_ids = []
    for i in range(10):
        try:
            resp = requests.post(f"{BASE_URL}/session/create", json={"duration": 5})
            if resp.status_code == 200:
                session_ids.append(resp.json()["session_id"])
        except:
            pass
    
    if not session_ids:
        print("Failed to create initial sessions")
        return
    
    def random_call():
        endpoint = random.choice([
            lambda: requests.get(f"{BASE_URL}/health"),
            lambda: requests.get(f"{BASE_URL}/"),
            lambda: requests.post(f"{BASE_URL}/session/create", json={"duration": 5}),
            lambda: requests.get(f"{BASE_URL}/session/{random.choice(session_ids)}/status"),
        ])
        try:
            resp = endpoint()
            return resp.status_code
        except:
            return 500
    
    start = time.time()
    results = []
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(random_call) for _ in range(100)]
        for future in as_completed(futures):
            results.append(future.result())
    
    duration = time.time() - start
    successes = sum(1 for r in results if r == 200)
    failures = sum(1 for r in results if r != 200)
    
    print(f"\nMixed API Calls: 100 requests in {duration:.2f}s")
    print(f"Success: {successes}, Failures: {failures}")
    print(f"Success rate: {successes/len(results)*100:.1f}%")

if __name__ == "__main__":
    print("="*50)
    print("STRESS TESTS AGAINST REAL SERVER")
    print("="*50)
    
    # Test server is reachable
    try:
        health = requests.get(f"{BASE_URL}/health")
        print(f"Server health: {health.status_code}")
    except:
        print("ERROR: Cannot reach server. Is it running on port 8000?")
        exit(1)
    
    print("\n1. Testing Burst Creations...")
    test_burst_creations()
    
    print("\n2. Testing Mixed API Calls...")
    test_mixed_calls()
    
    print("\n✅ Stress tests completed!")
