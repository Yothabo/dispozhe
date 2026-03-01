// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';


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

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async createSession(duration: number): Promise<SessionResponse> {
    const url = `${this.baseUrl}/session/create`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration }),
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('📡 Error response body:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.detail || 'Failed to create session');
        } catch (e) {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('📡 Fetch error:', error);
      throw error;
    }
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const url = `${this.baseUrl}/session/${sessionId}/status`;
    
    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📡 Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('📡 Fetch error:', error);
      throw error;
    }
  }

  async joinSession(sessionId: string): Promise<{ session_id: string; status: string; message: string }> {
    const url = `${this.baseUrl}/session/${sessionId}/join`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('📡 Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('📡 Fetch error:', error);
      throw error;
    }
  }

  async terminateSession(sessionId: string): Promise<{ status: string }> {
    const url = `${this.baseUrl}/session/${sessionId}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('📡 Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('📡 Fetch error:', error);
      throw error;
    }
  }

  async joinWithCode(code: string): Promise<CodeJoinResponse> {
    const url = `${this.baseUrl}/session/code/${code}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('📡 Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('📡 Fetch error:', error);
      throw error;
    }
  }
}

export const api = new ChatllyAPI();
export default api;
