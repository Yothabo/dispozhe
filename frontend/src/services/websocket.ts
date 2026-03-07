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
  private maxReconnectAttempts = 50;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private isTerminated = false;
  private connectionInProgress = false;
  private terminating = false;
  private messageQueue: WebSocketMessage[] = [];
  private connectionId: string | null = null;
  private lastPongTime: number = Date.now();
  private missedPongs = 0;
  private maxMissedPongs = 6;
  private lastActiveTime: number = Date.now();
  private isVisible: boolean = !document.hidden;
  private backgroundCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private handleVisibilityChange = () => {
    this.isVisible = !document.hidden;
    
    if (this.isVisible && this.currentSessionId && !this.isConnected() && !this.terminating) {
      this.reconnectAttempts = 0;
      this.connect(this.currentSessionId).catch(() => {
        // Silently handle connection error - will retry via reconnect mechanism
      });
    }
  };

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
    this.lastActiveTime = Date.now();
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
          this.lastActiveTime = Date.now();
          this.startHeartbeat();
          this.startBackgroundCheck();
          this.flushMessageQueue();
          
          this.messageHandlers.forEach(handler => {
            try {
              handler({ 
                type: 'connection_restored',
                timestamp: Date.now()
              });
            } catch {
              // Ignore handler errors
            }
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          if (this.connectionId !== newConnectionId) return;

          this.lastActiveTime = Date.now();
          this.lastPongTime = Date.now();
          this.missedPongs = 0;

          try {
            const data = JSON.parse(event.data) as WebSocketMessage;

            if (data.type === 'ping') {
              this.sendMessage({ type: 'pong', timestamp: Date.now() });
              return;
            }

            if (data.type === 'pong') {
              return;
            }

            if (data.type === 'participant_away') {
              this.messageHandlers.forEach(handler => {
                try {
                  handler({
                    type: 'user_away',
                    message: data.message,
                    timestamp: Date.now()
                  });
                } catch {
                  // Ignore handler errors
                }
              });
              return;
            }

            if (data.type === 'participant_reconnected') {
              this.messageHandlers.forEach(handler => {
                try {
                  handler({
                    type: 'user_returned',
                    timestamp: Date.now()
                  });
                } catch {
                  // Ignore handler errors
                }
              });
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

          if (!this.isVisible) {
            setTimeout(() => {
              if (this.shouldReconnect && !this.terminating) {
                this.attemptReconnect(true);
              }
            }, 30000);
            return;
          }

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(false);
          }
        };
      } catch (error) {
        this.connectionInProgress = false;
        reject(error);
      }
    });
  }

  private startBackgroundCheck() {
    this.stopBackgroundCheck();
    
    this.backgroundCheckInterval = setInterval(() => {
      if (!this.isVisible && this.isConnected()) {
        this.sendMessage({ type: 'background_keepalive', timestamp: Date.now() });
      }
      
      const inactiveTime = Date.now() - this.lastActiveTime;
      if (inactiveTime > 30 * 60 * 1000) {
        this.messageHandlers.forEach(handler => {
          try {
            handler({ 
              type: 'session_timeout',
              reason: 'inactivity'
            });
          } catch {
            // Ignore handler errors
          }
        });
        this.disconnect();
      }
    }, 60000);
  }

  private stopBackgroundCheck() {
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
      this.backgroundCheckInterval = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.lastPongTime = Date.now();
    this.missedPongs = 0;

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN && !this.isTerminated && !this.terminating) {
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        
        if (timeSinceLastPong > 45000) {
          this.missedPongs++;
          
          if (this.missedPongs >= this.maxMissedPongs) {
            this.ws.close();
            return;
          }
        } else {
          this.missedPongs = 0;
        }
        
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private attemptReconnect(isBackground: boolean = false) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    
    let delay;
    if (isBackground) {
      delay = 60000;
    } else {
      delay = Math.min(5000 * Math.pow(1.5, this.reconnectAttempts - 1), 300000);
    }

    this.reconnectTimer = setTimeout(() => {
      if (this.currentSessionId && !this.isTerminated && this.shouldReconnect && !this.terminating) {
        this.connect(this.currentSessionId).catch(() => {
          // Silently handle connection error - will retry via reconnect mechanism
        });
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
    this.stopBackgroundCheck();

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

    this.lastActiveTime = Date.now();

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

  getLastActiveTime(): number {
    return this.lastActiveTime;
  }
}

const wsService = new WebSocketService();
export default wsService;
