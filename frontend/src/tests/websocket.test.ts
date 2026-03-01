import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';

const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

describe('WebSocket Connection Tests', () => {
  let sessionId: string;
  let sessionCode: string;
  let ws1: WebSocket;
  let ws2: WebSocket;
  let ws1Messages: any[] = [];
  let ws2Messages: any[] = [];

  beforeAll(async () => {
    // Create a session
    const response = await fetch(`${API_URL}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 5 })
    });
    const data = await response.json();
    sessionId = data.session_id;
    sessionCode = data.code;
  });

  afterAll(() => {
    // Clean up WebSocket connections
    if (ws1 && ws1.readyState === WebSocket.OPEN) ws1.close();
    if (ws2 && ws2.readyState === WebSocket.OPEN) ws2.close();
  });

  it('should allow first participant to connect', async () => {
    return new Promise<void>((resolve, reject) => {
      ws1 = new WebSocket(`${WS_URL}/ws/${sessionId}`);
      
      ws1.on('open', () => {
        expect(ws1.readyState).toBe(WebSocket.OPEN);
        resolve();
      });

      ws1.on('error', (error) => {
        reject(error);
      });
    });
  });

  it('should receive connected message with count=1', async () => {
    return new Promise<void>((resolve, reject) => {
      const onMessage = (data: WebSocket.RawData) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'connected') {
          expect(message.connection_count).toBe(1);
          expect(message.session_id).toBe(sessionId);
          ws1.removeListener('message', onMessage);
          resolve();
        }
      };
      ws1.on('message', onMessage);
      ws1.on('error', reject);
    });
  });

  it('should allow second participant to join via code', async () => {
    const response = await fetch(`${API_URL}/session/code/${sessionCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.session_id).toBe(sessionId);
  });

  it('should allow second participant to connect', async () => {
    return new Promise<void>((resolve, reject) => {
      ws2 = new WebSocket(`${WS_URL}/ws/${sessionId}`);
      
      ws2.on('open', () => {
        expect(ws2.readyState).toBe(WebSocket.OPEN);
        resolve();
      });

      ws2.on('error', (error) => {
        reject(error);
      });
    });
  });

  it('should receive connected message with count=2', async () => {
    return new Promise<void>((resolve, reject) => {
      const onMessage = (data: WebSocket.RawData) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'connected') {
          expect(message.connection_count).toBe(2);
          ws2.removeListener('message', onMessage);
          resolve();
        }
      };
      ws2.on('message', onMessage);
      ws2.on('error', reject);
    });
  });

  it('should exchange messages between participants', async () => {
    const testMessage = 'Hello from participant 1';
    
    return new Promise<void>((resolve, reject) => {
      const onMessage = (data: WebSocket.RawData) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'message') {
          const decoded = atob(message.data);
          expect(decoded).toBe(testMessage);
          ws2.removeListener('message', onMessage);
          resolve();
        }
      };
      
      ws2.on('message', onMessage);
      ws2.on('error', reject);
      
      ws1.send(JSON.stringify({
        type: 'message',
        data: btoa(testMessage),
        timestamp: Date.now(),
        id: 'test-msg-1'
      }));
    });
  });

  it('should send message back from participant 2', async () => {
    const testMessage = 'Hello back from participant 2';
    
    return new Promise<void>((resolve, reject) => {
      const onMessage = (data: WebSocket.RawData) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'message') {
          const decoded = atob(message.data);
          expect(decoded).toBe(testMessage);
          ws1.removeListener('message', onMessage);
          resolve();
        }
      };
      
      ws1.on('message', onMessage);
      ws1.on('error', reject);
      
      ws2.send(JSON.stringify({
        type: 'message',
        data: btoa(testMessage),
        timestamp: Date.now(),
        id: 'test-msg-2'
      }));
    });
  });

  it('should handle typing indicators', async () => {
    return new Promise<void>((resolve, reject) => {
      const onMessage = (data: WebSocket.RawData) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'typing') {
          expect(message.isTyping).toBe(true);
          ws2.removeListener('message', onMessage);
          resolve();
        }
      };
      
      ws2.on('message', onMessage);
      ws2.on('error', reject);
      
      ws1.send(JSON.stringify({
        type: 'typing',
        isTyping: true,
        timestamp: Date.now()
      }));
    });
  });

  it('should reject third participant', async () => {
    return new Promise<void>((resolve, reject) => {
      const ws3 = new WebSocket(`${WS_URL}/ws/${sessionId}`);
      
      ws3.on('open', () => {
        reject(new Error('Third connection should not open'));
      });
      
      let closed = false;
      
      ws3.on('close', (code) => {
        if (!closed) {
          closed = true;
          // Accept either 1006 (HTTP 403 rejection) or 1008 (explicit close)
          expect([1006, 1008]).toContain(code);
          resolve();
        }
      });
      
      ws3.on('error', (error) => {
        // Don't reject on error - we'll wait for close event
      });
      
      // Set a timeout in case nothing happens
      setTimeout(() => {
        if (!closed) {
          reject(new Error('Third connection not rejected'));
        }
      }, 3000);
    });
  });

  it('should handle participant disconnection', async () => {
    return new Promise<void>((resolve) => {
      let ws2Closed = false;
      
      ws2.on('close', (code) => {
        ws2Closed = true;
        
        // Check that ws1 is still connected
        expect(ws1.readyState).toBe(WebSocket.OPEN);
        
        if (ws2Closed) {
          resolve();
        }
      });
      
      // Close participant 2
      setTimeout(() => {
        ws2.close();
      }, 100);
    });
  });

  it('should terminate session', async () => {
    return new Promise<void>((resolve) => {
      // Listen for session_terminated message
      const onMessage = (data: WebSocket.RawData) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'session_terminated') {
          ws1.removeListener('message', onMessage);
          resolve();
        }
      };
      
      ws1.on('message', onMessage);
      
      // Terminate the session via API
      fetch(`${API_URL}/session/${sessionId}`, {
        method: 'DELETE'
      }).then(response => {
        expect(response.status).toBe(200);
      }).catch(err => {
        console.error('Termination API error:', err);
      });
    });
  });
});
