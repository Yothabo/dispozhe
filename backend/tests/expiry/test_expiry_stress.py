"""EXPIRY ENGINE STRESS TESTS - Test automatic cleanup under load"""
import pytest
import time
import asyncio
import random
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app import app
from models.database import SessionLocal, Session
import threading

client = TestClient(app)

class TestExpiryStress:
    """Stress test the expiry engine"""
    
    def test_1000_sessions_expire_simultaneously(self):
        """Create 1000 sessions that all expire at the same time"""
        # Create 1000 sessions with 1-second duration
        session_ids = []
        for i in range(1000):
            resp = client.post("/session/create", json={"duration": 1})
            session_ids.append(resp.json()["session_id"])
        
        # Wait for them to expire
        time.sleep(2)
        
        # Check expiry worker ran
        db = SessionLocal()
        try:
            active = db.query(Session).filter(
                Session.status == "active",
                Session.id.in_(session_ids)
            ).count()
            
            expired = db.query(Session).filter(
                Session.status == "expired",
                Session.id.in_(session_ids)
            ).count()
            
            print(f"\n⏰ 1000 sessions after expiry:")
            print(f"   Active: {active}, Expired: {expired}")
            
            # Most should be expired (some might still be in grace period)
            assert expired > 950, f"Only {expired} expired"
        finally:
            db.close()
    
    def test_expiry_during_heavy_load(self):
        """Test expiry while system is under heavy API load"""
        # Start background load
        stop_load = threading.Event()
        
        def background_load():
            while not stop_load.is_set():
                try:
                    client.get("/health")
                    client.post("/session/create", json={"duration": random.randint(1, 60)})
                except:
                    pass
                time.sleep(0.01)
        
        # Start 10 load generators
        load_threads = []
        for _ in range(10):
            t = threading.Thread(target=background_load)
            t.start()
            load_threads.append(t)
        
        # Create 500 sessions with varying durations
        sessions = []
        for i in range(500):
            duration = random.randint(1, 3)
            resp = client.post("/session/create", json={"duration": duration})
            sessions.append({
                "id": resp.json()["session_id"],
                "duration": duration,
                "created": time.time()
            })
        
        # Wait for all to potentially expire
        time.sleep(4)
        
        # Stop load
        stop_load.set()
        for t in load_threads:
            t.join()
        
        # Check results
        db = SessionLocal()
        try:
            still_active = db.query(Session).filter(
                Session.status == "active",
                Session.id.in_([s["id"] for s in sessions])
            ).count()
            
            print(f"\n⚡ Expiry Under Load:")
            print(f"   Sessions still active: {still_active}/500")
            print(f"   Expiry rate: {(500-still_active)/500*100:.1f}%")
            
            # Most should be expired
            assert still_active < 50, f"Too many active: {still_active}"
        finally:
            db.close()
    
    def test_rapid_extend_during_expiry(self):
        """Test extending sessions while they're expiring"""
        # Create 200 sessions with 2-second duration
        session_ids = []
        for _ in range(200):
            resp = client.post("/session/create", json={"duration": 2})
            session_ids.append(resp.json()["session_id"])
        
        # Start extenders
        def extend_random():
            for _ in range(50):
                session_id = random.choice(session_ids)
                try:
                    client.post(f"/session/{session_id}/extend", json={"minutes": 1})
                except:
                    pass
                time.sleep(0.05)
        
        threads = []
        for _ in range(10):
            t = threading.Thread(target=extend_random)
            t.start()
            threads.append(t)
        
        # Wait for expiry
        time.sleep(3)
        
        for t in threads:
            t.join()
        
        # Check results
        db = SessionLocal()
        try:
            active = db.query(Session).filter(
                Session.status == "active",
                Session.id.in_(session_ids)
            ).count()
            
            print(f"\n🔄 Extend During Expiry:")
            print(f"   Active after extend attempts: {active}/200")
            
            # Some should have been extended successfully
            assert active > 0, "All sessions expired despite extensions"
        finally:
            db.close()
    
    def test_expiry_worker_performance(self):
        """Measure expiry worker performance with many sessions"""
        # Create 5000 sessions
        start_create = time.time()
        session_ids = []
        for i in range(5000):
            if i % 500 == 0:
                print(f"   Created {i}/5000 sessions...")
            resp = client.post("/session/create", json={"duration": 1})
            session_ids.append(resp.json()["session_id"])
        create_time = time.time() - start_create
        print(f"\n⚡ Created 5000 sessions in {create_time:.2f}s")
        
        # Measure expiry time
        start_expiry = time.time()
        time.sleep(2)  # Wait for expiry worker to run
        expiry_time = time.time() - start_expiry
        
        db = SessionLocal()
        try:
            expired = db.query(Session).filter(
                Session.status == "expired",
                Session.id.in_(session_ids)
            ).count()
            
            print(f"⏱️  Expiry worker processed {expired} sessions in {expiry_time:.2f}s")
            print(f"   Rate: {expired/expiry_time:.0f} sessions/second")
            
            assert expired > 4500, f"Only {expired} sessions expired"
        finally:
            db.close()
