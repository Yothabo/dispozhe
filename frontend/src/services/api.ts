// Use environment variable with fallback for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://driflly-backend.onrender.com';

export interface CreateSessionRequest {
  duration: number;
}

export interface SessionResponse {
  session_id: string;
  duration: number;
  expires_at: string;
  link: string;
  status: string;
  code?: string;
}

export interface SessionStatus {
  session_id: string;
  participant_count: number;
  status: string;
  expires_at: string;
  time_left_seconds: number;
}

export interface ExtendSessionRequest {
  minutes: number;
}

export interface CodeJoinResponse {
  session_id: string;
  encryption_key: string;
  status: string;
}

class ChatllyAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error('API health check failed');
    return response.json();
  }

  async createSession(duration: number): Promise<SessionResponse> {
    const response = await fetch(`${this.baseUrl}/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create session');
    }

    return response.json();
  }

  async joinWithCode(code: string): Promise<CodeJoinResponse> {
    const response = await fetch(`${this.baseUrl}/session/code/${code}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Invalid or expired code');
    }

    return response.json();
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get session status');
    }

    return response.json();
  }

  async joinSession(sessionId: string): Promise<{ session_id: string; status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to join session');
    }

    return response.json();
  }

  async extendSession(sessionId: string, minutes: number): Promise<{
    session_id: string;
    extended_by: number;
    expires_at: string;
    time_left_seconds: number;
  }> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}/extend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ minutes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to extend session');
    }

    return response.json();
  }

  async terminateSession(sessionId: string): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/session/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to terminate session');
    }

    return response.json();
  }
}

export const api = new ChatllyAPI();
export default api;
