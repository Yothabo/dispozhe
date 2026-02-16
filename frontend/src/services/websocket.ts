export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export type MessageHandler = (data: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private currentSessionId: string | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private isTerminated = false;
  private connectionInProgress = false;
  private terminating = false;

  private getWebSocketUrl(sessionId: string): string {
    // For local development, use localhost
    if (import.meta.env.DEV) {
      return `ws://localhost:8080/ws/${sessionId}`;
    }
    
    // For production, use the current host with proper protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/${sessionId}`;
  }

  connect(sessionId: string): Promise<void> {
    if (this.terminating) {
      return Promise.reject(new Error('Terminating'));
    }

    if (this.connectionInProgress) {
      return Promise.reject(new Error('Connection in progress'));
    }

    if (this.ws?.readyState === WebSocket.OPEN && this.currentSessionId === sessionId) {
      return Promise.resolve();
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connectionInProgress = true;
    this.currentSessionId = sessionId;
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.getWebSocketUrl(sessionId);
        console.log('[WebSocket] Connecting to:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected to session', sessionId);
          this.connectionInProgress = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Log all incoming messages for debugging
            console.log('[WebSocket] Received:', data.type, data);

            if (data.type === 'ping' || data.type === 'pong') {
              return;
            }

            if (data.type === 'connected') {
              console.log('[WebSocket] Connected message received with participant count:', data.participant_count);
            }

            if (data.type === 'destroying_session' || data.type === 'participant_leaving') {
              this.isTerminated = true;
              this.shouldReconnect = false;
              this.terminating = true;
            }

            this.messageHandlers.forEach(handler => {
              try {
                handler(data);
              } catch (e) {
                console.error('Handler error:', e);
              }
            });
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.connectionInProgress = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Closed:', event.code, event.reason);
          this.connectionInProgress = false;
          this.stopHeartbeat();

          if (this.terminating || this.isTerminated) {
            console.log('[WebSocket] Terminating, not reconnecting');
            return;
          }

          if (event.code === 1000) {
            console.log('[WebSocket] Normal close, not reconnecting');
            return;
          }

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        this.connectionInProgress = false;
        reject(error);
      }
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN && !this.isTerminated && !this.terminating) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000);

    console.log(`[WebSocket] Reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      if (this.currentSessionId && !this.isTerminated && this.shouldReconnect && !this.terminating) {
        this.connect(this.currentSessionId).catch(console.error);
      }
    }, delay);
  }

  disconnect() {
    this.shouldReconnect = false;
    this.connectionInProgress = false;
    this.isTerminated = false;
    this.terminating = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.currentSessionId = null;
    this.messageHandlers.clear();
    this.reconnectAttempts = 0;
  }

  sendMessage(message: any): boolean {
    if (this.terminating || this.isTerminated) {
      return false;
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  addMessageHandler(handler: MessageHandler) {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSessionId(): string | null {
    return this.currentSessionId;
  }

  setTerminating() {
    this.terminating = true;
    this.shouldReconnect = false;
  }

  isTerminating(): boolean {
    return this.terminating;
  }
}

export const wsService = new WebSocketService();
export default wsService;
