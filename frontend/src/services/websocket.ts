export type WebSocketMessage = {
  type: string;
  [key: string]: unknown;
};

export type MessageHandler = (data: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private currentSessionId: string | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20; // Increased max attempts
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private isTerminated = false;
  private connectionInProgress = false;
  private terminating = false;
  private messageQueue: WebSocketMessage[] = [];
  private connectionId: string | null = null;
  private lastPongTime: number = Date.now();
  private missedPongs = 0; // Track consecutive missed pongs
  private maxMissedPongs = 3; // Allow 3 missed pongs before closing - NOW USED

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
    this.lastPongTime = Date.now();
    this.missedPongs = 0;

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
          this.missedPongs = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          if (this.connectionId !== newConnectionId) return;

          try {
            const data = JSON.parse(event.data) as WebSocketMessage;

            if (data.type === 'ping') {
              this.sendMessage({ type: 'pong', timestamp: Date.now() });
              this.lastPongTime = Date.now();
              this.missedPongs = 0; // Reset missed pongs on any message
              return;
            }

            if (data.type === 'pong') {
              this.lastPongTime = Date.now();
              this.missedPongs = 0;
              return;
            }

            // Reset missed pongs on any message - connection is alive
            this.missedPongs = 0;
            this.lastPongTime = Date.now();

            if (data.type === 'destroying_session' || data.type === 'participant_leaving') {
              this.isTerminated = true;
              this.shouldReconnect = false;
              this.terminating = true;
            }

            this.messageHandlers.forEach(handler => {
              try {
                handler(data);
              } catch {
                // Ignore handler errors
              }
            });
          } catch {
            // Ignore parse errors
          }
        };

        this.ws.onerror = () => {
          if (this.connectionId !== newConnectionId) return;

          this.connectionInProgress = false;
          reject(new Error('WebSocket connection error'));
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

          // Don't treat production environment disconnects as permanent
          // Let the reconnection logic handle it with longer backoff
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
    this.lastPongTime = Date.now();
    this.missedPongs = 0;

    // Send ping every 20 seconds (more forgiving)
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN && !this.isTerminated && !this.terminating) {
        // Check connection health
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        
        // If we haven't received pong in 45 seconds, increment missed count
        if (timeSinceLastPong > 45000) {
          this.missedPongs++;
          
          // Only close after maxMissedPongs consecutive missed pongs (3 * 45s = 135s total)
          if (this.missedPongs >= this.maxMissedPongs) {  // NOW USING maxMissedPongs
            this.ws.close();
            return;
          }
        } else {
          // Reset missed count if we're getting pongs
          this.missedPongs = 0;
        }
        
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 20000); // Ping every 20 seconds
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
    // Exponential backoff with much longer delays (max 120 seconds)
    const delay = Math.min(3000 * Math.pow(1.5, this.reconnectAttempts - 1), 120000);

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

  sendMessage(message: WebSocketMessage): boolean {
    if (this.terminating || this.isTerminated) {
      return false;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch {
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
