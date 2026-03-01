import { describe, it, expect } from 'vitest';

const API_URL = 'http://localhost:8080';

describe('Session Management API', () => {
  let sessionId: string;
  let sessionCode: string;

  it('should create a new session', async () => {
    const response = await fetch(`${API_URL}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 5 })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('session_id');
    expect(data).toHaveProperty('code');
    expect(data.duration).toBe(5);
    expect(data.status).toBe('waiting');
    
    sessionId = data.session_id;
    sessionCode = data.code;
    
  });

  it('should get session status', async () => {
    const response = await fetch(`${API_URL}/session/${sessionId}/status`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.session_id).toBe(sessionId);
    expect(data.participant_count).toBe(1);
    expect(data.status).toBe('waiting');
    expect(data.time_left_seconds).toBeLessThanOrEqual(300);
  });

  it('should join session with code', async () => {
    const response = await fetch(`${API_URL}/session/code/${sessionCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.session_id).toBe(sessionId);
    expect(data.status).toBe('active');
    expect(data).toHaveProperty('encryption_key');
  });

  it('should reject invalid code', async () => {
    const response = await fetch(`${API_URL}/session/code/123456`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(404);
  });

  it('should reject duplicate join (code already used)', async () => {
    const response = await fetch(`${API_URL}/session/code/${sessionCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(404);
  });

  it('should terminate session', async () => {
    const response = await fetch(`${API_URL}/session/${sessionId}`, {
      method: 'DELETE'
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('terminated');
  });

  it('should return 404 for terminated session', async () => {
    const response = await fetch(`${API_URL}/session/${sessionId}/status`);
    expect(response.status).toBe(404);
  });
});
