import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';

const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

type WebSocketMessage = {
  type: string;
  connection_count?: number;
  data?: string;
  isTyping?: boolean;
  [key: string]: unknown;
};

describe('WebSocket Connection Tests', () => {
  let sessionId: string;
  let sessionCode: string;
  let ws1: WebSocket;
  let ws2: WebSocket;

  beforeAll(async () => {
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
    if (ws1 && ws1.readyState === WebSocket.OPEN) ws1.close();
    if (ws2 && ws2.readyState === WebSocket.OPEN) ws2.close();
  });

  const waitForEvent = (ws: WebSocket, event: string, timeout = 5000): Promise<WebSocketMessage> => {
    return new Promise((resolve, reject) => {
      if (!ws) {
        reject(new Error('WebSocket is undefined'));
        return;
      }

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for ${event}`));
      }, timeout);

      const handler = (data: WebSocket.RawData) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          if (message.type === event) {
            cleanup();
            resolve(message);
          }
        } catch {
          // Ignore parse errors
        }
      };

      const errorHandler = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        clearTimeout(timer);
        if (ws) {
          ws.removeListener('message', handler);
          ws.removeListener('error', errorHandler);
        }
      };

      ws.on('message', handler);
      ws.on('error', errorHandler);
    });
  };

  const connectParticipant = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${WS_URL}/ws/${sessionId}`);

      ws.on('open', () => {
        resolve(ws);
      });

      ws.on('error', (err) => {
        reject(err);
      });
    });
  };

  it('should connect first participant', async () => {
    ws1 = await connectParticipant();
    expect(ws1.readyState).toBe(WebSocket.OPEN);
  });

  it('should receive connected message for participant 1', async () => {
    const msg = await waitForEvent(ws1, 'connected');
    expect(msg.connection_count).toBe(1);
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

  it('should connect second participant', async () => {
    ws2 = await connectParticipant();
    expect(ws2.readyState).toBe(WebSocket.OPEN);
  });

  it('should receive connected message for participant 2', async () => {
    const msg = await waitForEvent(ws2, 'connected');
    expect(msg.connection_count).toBe(2);
  });

  it('should exchange messages between participants', async () => {
    const testMessage = 'Hello from participant 1';

    const messagePromise = waitForEvent(ws2, 'message');

    ws1.send(JSON.stringify({
      type: 'message',
      data: btoa(testMessage),
      timestamp: Date.now(),
      id: 'test-msg-1'
    }));

    const received = await messagePromise;
    const decoded = atob(received.data as string);
    expect(decoded).toBe(testMessage);
  });

  it('should send message back from participant 2', async () => {
    const testMessage = 'Hello back from participant 2';

    const messagePromise = waitForEvent(ws1, 'message');

    ws2.send(JSON.stringify({
      type: 'message',
      data: btoa(testMessage),
      timestamp: Date.now(),
      id: 'test-msg-2'
    }));

    const received = await messagePromise;
    const decoded = atob(received.data as string);
    expect(decoded).toBe(testMessage);
  });

  it('should handle typing indicators', async () => {
    const typingPromise = waitForEvent(ws2, 'typing');

    ws1.send(JSON.stringify({
      type: 'typing',
      isTyping: true,
      timestamp: Date.now()
    }));

    const received = await typingPromise;
    expect(received.isTyping).toBe(true);
  });

  it('should reject third participant', async () => {
    return new Promise<void>((resolve) => {
      const ws3 = new WebSocket(`${WS_URL}/ws/${sessionId}`);

      ws3.on('open', () => {
        ws3.close();
        throw new Error('Third connection should not open');
      });

      ws3.on('close', () => {
        resolve();
      });

      ws3.on('error', () => {
        resolve();
      });
    });
  });

  it('should handle participant disconnection', async () => {
    const closePromise = new Promise<void>((resolve) => {
      if (!ws2) {
        resolve();
        return;
      }
      ws2.once('close', () => resolve());
    });

    if (ws2) {
      ws2.close();
      await closePromise;
    }

    expect(ws1.readyState).toBe(WebSocket.OPEN);
  });

  it('should terminate session', async () => {
    if (!ws1) {
      throw new Error('WebSocket not connected');
    }

    const terminatedPromise = waitForEvent(ws1, 'session_terminated');

    const response = await fetch(`${API_URL}/session/${sessionId}`, {
      method: 'DELETE'
    });
    expect(response.status).toBe(200);

    await terminatedPromise;
  });
});
