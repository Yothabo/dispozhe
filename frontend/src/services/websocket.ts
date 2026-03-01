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
  private messageQueue: any[] = [];
  private connectionId: string | null = null;

  private getWebSocketUrl(sessionId: string): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://dispozhe.onrender.com';
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    return `${wsUrl}/ws/${sessionId}`;
  }

  connect(sessionId: string): Promise<void> {
    if (this.terminating) {
      return Promise.reject(new Error('Terminating'));
    }

    if (this.connectionInProgress) {
      return Promise.reject(new Error('Connection in progress'));
    }

    if (this.ws?.readyState === WebSocket.OPEN && this.currentSessionId === sessionId) {
      this.flushMessageQueue();
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
    this.messageQueue = [];

    const newConnectionId = `${sessionId}-${Date.now()}-${Math.random()}`;
    this.connectionId = newConnectionId;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.getWebSocketUrl(sessionId);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          if (this.connectionId !== newConnectionId) return;

          this.connectionInProgress = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          if (this.connectionId !== newConnectionId) return;

          try {
            const data = JSON.parse(event.data);

            if (data.type === 'ping') {
              this.sendMessage({ type: 'pong', timestamp: Date.now() });
              return;
            }

            if (data.type === 'pong') {
              return;
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
                console.error('[WebSocket] Handler error:', e);
              }
            });
          } catch (e) {
            console.error('[WebSocket] Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          if (this.connectionId !== newConnectionId) return;

          this.connectionInProgress = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          if (this.connectionId !== newConnectionId) return;

          this.connectionInProgress = false;
          this.stopHeartbeat();

          if (this.terminating || this.isTerminated) {
            return;
          }

          if (event.code === 1000) {
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
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 8000);

    this.reconnectTimer = setTimeout(() => {
      if (this.currentSessionId && !this.isTerminated && this.shouldReconnect && !this.terminating) {
        this.connect(this.currentSessionId).catch(() => {});
      }
    }, delay);
  }

  private flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      const queue = [...this.messageQueue];
      this.messageQueue = [];
      queue.forEach(msg => this.sendMessage(msg));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.connectionInProgress = false;
    this.isTerminated = false;
    this.terminating = false;
    this.messageQueue = [];

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
    this.connectionId = null;
  }

  sendMessage(message: any): boolean {
    if (this.terminating || this.isTerminated) {
      return false;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (err) {
        this.messageQueue.push(message);
        return false;
      }
    } else {
      this.messageQueue.push(message);
      return false;
    }
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

const wsService = new WebSocketService();
export default wsService;
