export type WebSocketMessage = {
  type: string;
  id?: string;
  data?: string;
  keyId?: string;
  timestamp?: number;
  isTyping?: boolean;
  messageId?: string;
  [key: string]: unknown;
};

export type MessageHandler = (data: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private currentSessionId: string | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 30;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private messageQueue: WebSocketMessage[] = [];
  private lastPongTime: number = Date.now();
  private isIntentionalDisconnect = false;
  private missedPongs = 0;
  private maxMissedPongs = 5;
  private connectionPromise: Promise<void> | null = null;
  private connectionResolver: (() => void) | null = null;
  private connectionRejecter: ((error: Error) => void) | null = null;

  private getWebSocketUrl(sessionId: string): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    return `${wsUrl}/ws/${sessionId}`;
  }

  connect(sessionId: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN && this.currentSessionId === sessionId) {
      return Promise.resolve();
    }
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    this.isIntentionalDisconnect = false;
    this.currentSessionId = sessionId;
    this.missedPongs = 0;
    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolver = resolve;
      this.connectionRejecter = reject;
      try {
        const wsUrl = this.getWebSocketUrl(sessionId);
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.missedPongs = 0;
          this.lastPongTime = Date.now();
          this.startHeartbeat();
          this.flushMessageQueue();
          if (this.connectionResolver) {
            this.connectionResolver();
            this.connectionResolver = null;
            this.connectionRejecter = null;
            this.connectionPromise = null;
          }
        };
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            if (data.type === 'ping') {
              this.sendMessage({ type: 'pong', timestamp: Date.now() });
              this.lastPongTime = Date.now();
              this.missedPongs = 0;
              return;
            }
            if (data.type === 'pong') {
              this.lastPongTime = Date.now();
              this.missedPongs = 0;
              return;
            }
            this.messageHandlers.forEach(handler => {
              try {
                handler(data);
              } catch {
                // Silently fail individual handler errors
              }
            });
          } catch {
            // Silently fail parse errors
          }
        };
        this.ws.onerror = () => {
          if (!this.isIntentionalDisconnect && this.connectionRejecter) {
            this.connectionRejecter(new Error('WebSocket connection failed'));
            this.connectionResolver = null;
            this.connectionRejecter = null;
            this.connectionPromise = null;
          }
        };
        this.ws.onclose = (event) => {
          this.stopHeartbeat();
          if (this.connectionRejecter) {
            this.connectionRejecter(new Error(`WebSocket closed: ${event.code}`));
            this.connectionResolver = null;
            this.connectionRejecter = null;
            this.connectionPromise = null;
          }
          if (this.isIntentionalDisconnect) {
            return;
          }
          if (event.code === 1000) {
            return;
          }
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch {
        if (this.connectionRejecter) {
          this.connectionRejecter(new Error('WebSocket connection failed'));
          this.connectionResolver = null;
          this.connectionRejecter = null;
          this.connectionPromise = null;
        }
      }
    });
    return this.connectionPromise;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.lastPongTime = Date.now();
    this.missedPongs = 0;
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        if (timeSinceLastPong > 30000) {
          this.missedPongs++;
          if (this.missedPongs >= this.maxMissedPongs) {
            this.ws.close();
            return;
          }
        } else {
          this.missedPongs = 0;
        }
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private attemptReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
    this.reconnectTimer = setTimeout(() => {
      if (this.currentSessionId && this.shouldReconnect) {
        this.connectionPromise = null;
        this.connect(this.currentSessionId).catch(() => {
          // Silently fail reconnect attempts
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
    this.isIntentionalDisconnect = true;
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }
    this.currentSessionId = null;
    this.messageHandlers.clear();
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.missedPongs = 0;
    this.connectionPromise = null;
    this.connectionResolver = null;
    this.connectionRejecter = null;
  }

  sendMessage(message: WebSocketMessage): boolean {
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
    this.shouldReconnect = false;
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

const wsService = new WebSocketService();
export default wsService;
