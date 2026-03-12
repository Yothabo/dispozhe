from locust import HttpUser, task, between
import random
import string

class ChatUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Create a session when user starts"""
        response = self.client.post("/session/create", json={"duration": 5})
        if response.status_code == 200:
            self.session_id = response.json()["session_id"]
            self.code = response.json().get("code")
    
    @task(3)
    def check_status(self):
        """Check session status"""
        if hasattr(self, 'session_id'):
            self.client.get(f"/session/{self.session_id}/status")
    
    @task(1)
    def create_session(self):
        """Create new session"""
        self.client.post("/session/create", json={"duration": random.randint(1, 10)})
    
    @task(1)
    def health_check(self):
        """Health check endpoint"""
        self.client.get("/health")
    
    @task(1)
    def try_invalid_code(self):
        """Try invalid codes"""
        fake_code = ''.join(random.choices(string.digits, k=6))
        self.client.post(f"/session/code/{fake_code}")
