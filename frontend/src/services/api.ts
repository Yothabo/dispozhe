const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiService {
  async createSession(duration: number, signal?: AbortSignal) {
    const response = await fetch(`${API_URL}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }

    return response.json();
  }

  async joinSession(sessionId: string) {
    const response = await fetch(`${API_URL}/session/${sessionId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to join session: ${response.status}`);
    }

    return response.json();
  }

  async joinWithCode(code: string) {
    const response = await fetch(`${API_URL}/session/code/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to join with code: ${response.status}`);
    }

    return response.json();
  }

  async getSessionStatus(sessionId: string) {
    const response = await fetch(`${API_URL}/session/${sessionId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get session status: ${response.status}`);
    }

    return response.json();
  }

  async terminateSession(sessionId: string) {
    const response = await fetch(`${API_URL}/session/${sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to terminate session: ${response.status}`);
    }

    return response.json();
  }
}

export default new ApiService();
