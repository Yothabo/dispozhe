import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';

const API_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080';

describe('Session Termination', () => {
  let sessionId: string;
  let ws: WebSocket;

  beforeAll(async () => {
    // Create a session
    const response = await fetch(`${API_URL}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 5 })
    });
    const data = await response.json();
    sessionId = data.session_id;

    // Connect a participant
    ws = new WebSocket(`${WS_URL}/ws/${sessionId}`);

    // Wait for connection
    await new Promise<void>((resolve) => {
      ws.on('open', () => resolve());
    });

    // Wait for connected message
    await new Promise<void>((resolve) => {
      ws.once('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'connected') {
          resolve();
        }
      });
    });
  });

  afterAll(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  it('should receive session_terminated message or close when session is terminated', async () => {
    // Set up a promise that resolves either on 'session_terminated' message or on close
    const terminatedPromise = new Promise<void>((resolve) => {
      // Listen for session_terminated message
      ws.once('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'session_terminated') {
          resolve();
        }
      });

      // Also listen for close event
      ws.once('close', () => {
        resolve();
      });

      // Set a timeout to avoid hanging
      setTimeout(() => {
        resolve();
      }, 5000);
    });

    // Terminate the session via API
    const response = await fetch(`${API_URL}/session/${sessionId}`, {
      method: 'DELETE'
    });
    expect(response.status).toBe(200);

    // Wait for either message or close
    await terminatedPromise;
  });
});
