export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'failed';
export type MessageHandler = (data: any) => void;

class ConnectionManager {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private status: ConnectionStatus = 'disconnected';
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionInProgress = false;
  private isTerminated = false;
  private shouldReconnect = true;
  private connectionId: string | null = null; // Unique ID for this connection instance

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  connect(sessionId: string): void {
    // If already connecting to the same session, don't start another connection
    if (this.connectionInProgress && this.sessionId === sessionId) {
      console.log('[ConnectionManager] Connection already in progress for this session');
      return;
    }

    // If already connected to this session, don't reconnect
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId === sessionId) {
      console.log('[ConnectionManager] Already connected to session', sessionId);
      this.setStatus('connected');
      return;
    }

    // If we're switching sessions, clean up old connection
    if (this.sessionId && this.sessionId !== sessionId) {
      console.log('[ConnectionManager] Switching sessions, cleaning up old connection');
      this.disconnect();
    }

    // Generate a unique ID for this connection attempt
    const newConnectionId = `${sessionId}-${Date.now()}-${Math.random()}`;
    this.connectionId = newConnectionId;
    this.sessionId = sessionId;
    this.connectionInProgress = true;
    this.setStatus('connecting');

    console.log(`[ConnectionManager] Connecting to session ${sessionId} (ID: ${newConnectionId})`);

    try {
      const wsUrl = `ws://localhost:8080/ws/${sessionId}`;
      
      // Close any existing socket
      if (this.ws) {
        try {
          this.ws.close();
        } catch (e) {}
        this.ws = null;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Check if this is still the current connection attempt
        if (this.connectionId !== newConnectionId) {
          console.log('[ConnectionManager] Stale connection opened, ignoring');
          return;
        }

        console.log('[ConnectionManager] Connected to session', sessionId);
        this.connectionInProgress = false;
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        // Only process messages for the current connection
        if (this.connectionId !== newConnectionId) return;

        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ping' || data.type === 'pong') {
            return;
          }
          
          if (data.type === 'destroying_session' || data.type === 'participant_leaving') {
            console.log(`[ConnectionManager] Received ${data.type}`);
            this.isTerminated = true;
            this.shouldReconnect = false;
            this.stopHeartbeat();
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
        // Only handle errors for the current connection
        if (this.connectionId !== newConnectionId) return;

        console.error('[ConnectionManager] WebSocket error:', error);
        this.connectionInProgress = false;
        this.setStatus('failed');
      };

      this.ws.onclose = (event) => {
        // Only handle close for the current connection
        if (this.connectionId !== newConnectionId) return;

        console.log('[ConnectionManager] WebSocket closed:', event.code, event.reason);
        this.connectionInProgress = false;
        this.stopHeartbeat();
        
        if (this.isTerminated) {
          this.setStatus('disconnected');
          return;
        }

        // Only attempt reconnect if:
        // 1. We should reconnect
        // 2. Not a normal close (1000)
        // 3. Haven't exceeded max attempts
        if (this.shouldReconnect && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          this.setStatus('disconnected');
        }
      };
    } catch (error) {
      console.error('[ConnectionManager] Connection error:', error);
      this.connectionInProgress = false;
      this.setStatus('failed');
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN && !this.isTerminated) {
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
    const delay = 2000 * this.reconnectAttempts;
    
    console.log(`[ConnectionManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.sessionId && !this.isTerminated && this.shouldReconnect) {
        this.connect(this.sessionId);
      }
    }, delay);
  }

  disconnect() {
    console.log('[ConnectionManager] Manually disconnecting');
    this.shouldReconnect = false;
    this.connectionInProgress = false;
    this.isTerminated = false;
    this.connectionId = null;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.sessionId = null;
    this.setStatus('disconnected');
  }

  sendMessage(message: any): boolean {
    if (this.isTerminated) {
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
}

export default new ConnectionManager();
