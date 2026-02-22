// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

console.log('%c🔧 API Configuration', 'font-size: 16px; color: #64FFDA; font-weight: bold');
console.log('📡 Mode:', import.meta.env.MODE);
console.log('📡 API URL from env:', import.meta.env.VITE_API_URL);
console.log('📡 Using base URL:', API_BASE_URL);
console.log('📡 Full env object:', import.meta.env);

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
    console.log('📡 API instance created with URL:', this.baseUrl);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async createSession(duration: number): Promise<SessionResponse> {
    const url = `${this.baseUrl}/session/create`;
    console.log('📡 POST request to:', url);
    console.log('📡 Request body:', { duration });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

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
      console.log('📡 Session created:', data);
      return data;
    } catch (error) {
      console.error('📡 Fetch error:', error);
      throw error;
    }
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const url = `${this.baseUrl}/session/${sessionId}/status`;
    console.log('📡 GET request to:', url);
    
    try {
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);

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
    console.log('📡 POST request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

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
    console.log('📡 DELETE request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
      });

      console.log('📡 Response status:', response.status);

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
    console.log('📡 POST request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

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
