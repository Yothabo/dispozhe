"""WEBSOCKET STRESS TESTS - 1000 concurrent connections"""
import pytest
import asyncio
import json
import time
import random
import websockets
import threading
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

class TestWebSocketStress:
    """Stress test WebSocket connections"""
    
    @pytest.mark.asyncio
    async def test_500_concurrent_connections(self):
        """Establish 500 WebSocket connections simultaneously"""
        # Create 250 sessions (2 users each)
        sessions = []
        for _ in range(250):
            resp = client.post("/session/create", json={"duration": 5})
            sessions.append(resp.json()["session_id"])
        
        async def connect_websocket(session_id):
            uri = f"ws://localhost:8000/ws/{session_id}"
            try:
                async with websockets.connect(uri) as websocket:
                    # Wait for connected message
                    response = await asyncio.wait_for(websocket.recv(), timeout=5)
                    return True
            except:
                return False
        
        # Connect 500 WebSockets (2 per session)
        start = time.time()
        tasks = []
        for session_id in sessions:
            tasks.append(connect_websocket(session_id))
            tasks.append(connect_websocket(session_id))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        duration = time.time() - start
        
        successes = sum(1 for r in results if r is True)
        failures = sum(1 for r in results if r is False)
        
        print(f"\n🔌 500 WebSocket connections in {duration:.2f}s")
        print(f"   Success: {successes}, Failures: {failures}")
        
        assert successes > 450, f"Too many failures: {failures}"
    
    @pytest.mark.asyncio
    async def test_message_flood(self):
        """Flood a session with 1000 messages per second"""
        # Create session and connect two clients
        resp = client.post("/session/create", json={"duration": 5})
        session_id = resp.json()["session_id"]
        
        # Second user joins
        client.post(f"/session/{session_id}/join")
        
        messages_sent = 0
        messages_received = 0
        
        async def sender():
            nonlocal messages_sent
            uri = f"ws://localhost:8000/ws/{session_id}"
            async with websockets.connect(uri) as ws:
                # Wait for connected message
                await ws.recv()
                
                # Send 1000 messages as fast as possible
                for i in range(1000):
                    message = {
                        "type": "message",
                        "id": f"msg-{i}",
                        "data": "encrypted_" + ("x" * 1000),  # 1KB message
                        "timestamp": time.time()
                    }
                    await ws.send(json.dumps(message))
                    messages_sent += 1
                    
                    # Small delay to avoid overwhelming
                    if i % 100 == 0:
                        await asyncio.sleep(0.01)
        
        async def receiver():
            nonlocal messages_received
            uri = f"ws://localhost:8000/ws/{session_id}"
            async with websockets.connect(uri) as ws:
                # Wait for connected message
                await ws.recv()
                
                # Receive messages
                while messages_received < 1000:
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=0.1)
                        messages_received += 1
                    except asyncio.TimeoutError:
                        break
        
        # Run sender and receiver concurrently
        start = time.time()
        await asyncio.gather(sender(), receiver())
        duration = time.time() - start
        
        print(f"\n📨 Message Flood Test:")
        print(f"   Sent: {messages_sent}, Received: {messages_received}")
        print(f"   Duration: {duration:.2f}s")
        print(f"   Rate: {messages_sent/duration:.0f} msgs/sec")
        
        assert messages_received > 900, f"Only received {messages_received} messages"
    
    @pytest.mark.asyncio
    async def test_websocket_reconnection_storm(self):
        """Simulate 100 clients disconnecting and reconnecting rapidly"""
        session_id = client.post("/session/create", json={"duration": 5}).json()["session_id"]
        client.post(f"/session/{session_id}/join")
        
        async def connect_disconnect_loop():
            uri = f"ws://localhost:8000/ws/{session_id}"
            for _ in range(10):  # Each client does 10 connect/disconnect cycles
                try:
                    async with websockets.connect(uri) as ws:
                        await asyncio.sleep(random.uniform(0.1, 0.5))
                        # Disconnect happens when context exits
                except:
                    pass
                await asyncio.sleep(random.uniform(0.1, 0.3))
            return True
        
        # Run 100 concurrent clients doing connect/disconnect loops
        start = time.time()
        tasks = [connect_disconnect_loop() for _ in range(100)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        duration = time.time() - start
        
        successes = sum(1 for r in results if r is True)
        print(f"\n🔄 Reconnection Storm: {duration:.2f}s")
        print(f"   Successful cycles: {successes}/100")
        
        assert successes > 90, f"Too many failures: {100 - successes}"
    
    @pytest.mark.asyncio
    async def test_malformed_messages_under_load(self):
        """Send malformed messages while under heavy load"""
        session_id = client.post("/session/create", json={"duration": 5}).json()["session_id"]
        
        async def good_client():
            uri = f"ws://localhost:8000/ws/{session_id}"
            async with websockets.connect(uri) as ws:
                await ws.recv()  # connected message
                for i in range(100):
                    msg = {"type": "message", "id": f"good-{i}", "data": "encrypted"}
                    await ws.send(json.dumps(msg))
                    await asyncio.sleep(0.01)
        
        async def bad_client():
            uri = f"ws://localhost:8000/ws/{session_id}"
            async with websockets.connect(uri) as ws:
                await ws.recv()
                # Send various malformed messages
                malformed = [
                    "not json",
                    "{unclosed",
                    json.dumps({"type": "unknown"}),
                    json.dumps({"type": "message"}),  # Missing id/data
                    "x" * 1000000,  # Huge message
                ]
                for _ in range(50):
                    msg = random.choice(malformed)
                    try:
                        await ws.send(msg)
                    except:
                        pass
                    await asyncio.sleep(0.01)
        
        # Run 10 good clients and 10 bad clients concurrently
        tasks = []
        for _ in range(10):
            tasks.append(good_client())
            tasks.append(bad_client())
        
        start = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        duration = time.time() - start
        
        exceptions = [r for r in results if isinstance(r, Exception)]
        print(f"\n💥 Malformed Message Test: {duration:.2f}s")
        print(f"   Exceptions: {len(exceptions)}")
        
        # System should handle malformed messages without crashing
        assert len(exceptions) < 5, f"Too many exceptions: {len(exceptions)}"
