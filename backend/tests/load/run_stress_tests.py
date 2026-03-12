import requests
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:8000"

def test_concurrent_creations():
    """Simple stress test against real server"""
    success = 0
    failed = 0
    
    def create_session():
        try:
            resp = requests.post(f"{BASE_URL}/session/create", json={"duration": 5})
            return resp.status_code == 200
        except:
            return False
    
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = [executor.submit(create_session) for _ in range(100)]
        for future in as_completed(futures):
            if future.result():
                success += 1
            else:
                failed += 1
    
    print(f"Success: {success}, Failed: {failed}")
    return success, failed

if __name__ == "__main__":
    print("Running stress tests against real server...")
    test_concurrent_creations()
