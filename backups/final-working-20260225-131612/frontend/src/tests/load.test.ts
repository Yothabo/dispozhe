import { describe, it, expect } from 'vitest';

const API_URL = 'http://localhost:8080';

describe('Load Testing', () => {
  it('should handle multiple session creations', async () => {
    const sessions = [];
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`${API_URL}/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 1 })
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      sessions.push(data.session_id);
      
      // Clean up
      await fetch(`${API_URL}/session/${data.session_id}`, {
        method: 'DELETE'
      });
    }
    expect(sessions.length).toBe(5);
    console.log(` Created and cleaned up ${sessions.length} sessions`);
  });
});
