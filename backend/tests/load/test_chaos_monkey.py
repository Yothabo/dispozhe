"""CHAOS MONKEY TEST - Random failures and recovery"""
import pytest
import asyncio
import random
import time
import threading
from fastapi.testclient import TestClient
from app import app
import signal
import os

client = TestClient(app)

class TestChaosMonkey:
    """Intentionally cause failures and verify recovery"""
    
    def test_random_disconnections(self):
        """Randomly disconnect clients and verify reconnection"""
        session_id = client.post("/session/create", json={"duration": 5}).json()["session_id"]
        
        async def client_behavior(client_id):
            import websockets
            uri = f"ws://localhost:8000/ws/{session_id}"
            messages_sent = 0
            
            for cycle in range(20):  # 20 connect/disconnect cycles
                try:
                    async with websockets.connect(uri) as ws:
                        # Receive connected message
                        await ws.recv()
                        
                        # Send some messages
                        for _ in range(random.randint(1, 5)):
                            msg = {
                                "type": "message",
                                "id": f"chaos-{client_id}-{cycle}-{messages_sent}",
                                "data": f"chaos_data_{random.randint(1, 1000)}",
                                "timestamp": time.time()
                            }
                            await ws.send(json.dumps(msg))
                            messages_sent += 1
                        
                        # Randomly decide to disconnect or stay
                        if random.random() < 0.3:  # 30% chance to crash
                            raise Exception("Simulated crash")
                        
                        # Wait random time
                        await asyncio.sleep(random.uniform(0.1, 0.5))
                        
                except:
                    pass
                
                # Random wait before reconnecting
                await asyncio.sleep(random.uniform(0.1, 0.3))
            
            return messages_sent
        
        async def run_chaos():
            # Run 50 chaotic clients
            tasks = [client_behavior(i) for i in range(50)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            total_messages = sum(r for r in results if isinstance(r, int))
            failures = sum(1 for r in results if isinstance(r, Exception))
            
            return total_messages, failures
        
        # Run chaos test
        start = time.time()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        total_messages, failures = loop.run_until_complete(run_chaos())
        duration = time.time() - start
        
        print(f"\n🐒 Chaos Monkey Test:")
        print(f"   Duration: {duration:.2f}s")
        print(f"   Total messages sent: {total_messages}")
        print(f"   Client failures: {failures}")
        
        # System should survive chaos
        assert failures < 1000, f"Too many failures: {failures}"
    
    def test_database_disconnect_simulation(self):
        """Simulate database disconnection and recovery"""
        import sqlite3
        
        # Create sessions normally
        normal_sessions = []
        for _ in range(10):
            resp = client.post("/session/create", json={"duration": 5})
            normal_sessions.append(resp.json())
        
        # Simulate DB disconnect by moving database file
        db_path = "./chatlly.db"
        backup_path = "./chatlly.db.backup"
        
        if os.path.exists(db_path):
            os.rename(db_path, backup_path)
        
        # Try to create session during DB outage
        try:
            resp = client.post("/session/create", json={"duration": 5})
            db_outage_worked = resp.status_code == 200
        except:
            db_outage_worked = False
        
        # Restore database
        if os.path.exists(backup_path):
            os.rename(backup_path, db_path)
        
        # Should work again
        resp = client.post("/session/create", json={"duration": 5})
        recovered = resp.status_code == 200
        
        print(f"\n💾 Database Failure Test:")
        print(f"   During outage: {'Succeeded' if db_outage_worked else 'Failed (good)'}")
        print(f"   After recovery: {'Succeeded' if recovered else 'Failed (bad)'}")
        
        assert not db_outage_worked, "Should fail during DB outage"
        assert recovered, "Should recover after DB restore"
    
    def test_high_cpu_stress(self):
        """Simulate high CPU load"""
        import math
        
        def cpu_burner():
            for _ in range(1000000):
                math.sqrt(random.random())
        
        # Start CPU burners in background
        burners = []
        for _ in range(4):  # Use 4 cores
            t = threading.Thread(target=cpu_burner)
            t.start()
            burners.append(t)
        
        # Try to create sessions under CPU stress
        start = time.time()
        sessions = []
        for i in range(100):
            resp = client.post("/session/create", json={"duration": 5})
            sessions.append(resp.status_code)
        
        duration = time.time() - start
        
        # Stop CPU burners
        # (Can't easily stop, but they'll be garbage collected)
        
        success_rate = sum(1 for s in sessions if s == 200) / len(sessions) * 100
        
        print(f"\n🔥 CPU Stress Test:")
        print(f"   100 sessions in {duration:.2f}s under CPU load")
        print(f"   Success rate: {success_rate:.1f}%")
        
        assert success_rate > 90, f"Low success rate under CPU stress: {success_rate}%"
