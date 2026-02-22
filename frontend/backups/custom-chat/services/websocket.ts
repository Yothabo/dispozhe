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

  // Get the correct WebSocket URL based on environment
  private getWebSocketUrl(sessionId: string): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://dispozhe.onrender.com';
    // Convert https:// to wss:// and http:// to ws://
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    return `${wsUrl}/ws/${sessionId}`;
  }

  connect(sessionId: string): Promise<void> {
    if (this.terminating) {
      return Promise.reject(new Error('Terminating'));
    }

    if (this.connectionInProgress) {
      console.log('[WebSocket] Connection already in progress');
      return Promise.reject(new Error('Connection in progress'));
    }

    if (this.ws?.readyState === WebSocket.OPEN && this.currentSessionId === sessionId) {
      console.log('[WebSocket] Already connected');
      this.flushMessageQueue();
      return Promise.resolve();
    }

    if (this.ws) {
      console.log('[WebSocket] Closing existing connection');
      this.ws.close();
      this.ws = null;
    }

    this.connectionInProgress = true;
    this.currentSessionId = sessionId;
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
    this.messageQueue = [];

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
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Received:', data.type, data);

            if (data.type === 'ping') {
              this.sendMessage({ type: 'pong', timestamp: Date.now() });
              return;
            }

            if (data.type === 'pong') {
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
                console.error('[WebSocket] Handler error:', e);
              }
            });
          } catch (e) {
            console.error('[WebSocket] Failed to parse message:', e);
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
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 8000);

    console.log(`[WebSocket] Reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      if (this.currentSessionId && !this.isTerminated && this.shouldReconnect && !this.terminating) {
        console.log('[WebSocket] Attempting to reconnect...');
        this.connect(this.currentSessionId).catch(err => {
          console.error('[WebSocket] Reconnect failed:', err);
        });
      }
    }, delay);
  }

  private flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`[WebSocket] Flushing ${this.messageQueue.length} queued messages`);
      const queue = [...this.messageQueue];
      this.messageQueue = [];
      queue.forEach(msg => this.sendMessage(msg));
    }
  }

  disconnect() {
    console.log('[WebSocket] Disconnecting...');
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
  }

  sendMessage(message: any): boolean {
    console.log('[WebSocket] Sending:', message.type, message);

    if (this.terminating || this.isTerminated) {
      console.warn('[WebSocket] Cannot send - terminating');
      return false;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (err) {
        console.error('[WebSocket] Send error:', err);
        this.messageQueue.push(message);
        return false;
      }
    } else {
      console.warn('[WebSocket] Not connected, queueing message');
      this.messageQueue.push(message);
      return false;
    }
  }

  addMessageHandler(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    console.log('[WebSocket] Added message handler, total:', this.messageHandlers.size);
  }

  removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers.delete(handler);
    console.log('[WebSocket] Removed message handler, total:', this.messageHandlers.size);
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
