import { useEffect, useRef, useCallback } from 'react';
import wsService from '../services/websocket';

export const useStableWebSocket = (
  sessionId: string,
  onMessage: (data: any) => void,
  dependencies: any[] = []
) => {
  const handlerRef = useRef(onMessage);
  const mountedRef = useRef(true);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionCheckInterval = useRef<NodeJS.Timeout>();
  const lastPongRef = useRef<number>(Date.now());

  // Update handler ref when onMessage changes
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  // Stable message handler
  const stableHandler = useCallback((data: any) => {
    if (mountedRef.current) {
      if (data.type === 'pong') {
        lastPongRef.current = Date.now();
      } else {
        handlerRef.current(data);
      }
    }
  }, []);

  // Connection health check
  useEffect(() => {
    connectionCheckInterval.current = setInterval(() => {
      if (!mountedRef.current) return;
      
      const now = Date.now();
      const timeSinceLastPong = now - lastPongRef.current;
      
      // If no pong for 45 seconds, consider connection dead
      if (timeSinceLastPong > 45000 && wsService.isConnected()) {
        console.log('[WebSocket] No pong received, reconnecting...');
        wsService.disconnect();
        attemptReconnect();
      }
    }, 10000);

    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
    };
  }, []);

  const attemptReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
      
      console.log(`[WebSocket] Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && sessionId) {
          wsService.connect(sessionId).catch(err => {
            console.error('[WebSocket] Reconnect failed:', err);
          });
        }
      }, delay);
    }
  }, [sessionId]);

  // Main connection effect
  useEffect(() => {
    mountedRef.current = true;
    reconnectAttempts.current = 0;
    lastPongRef.current = Date.now();

    // Add message handler
    wsService.addMessageHandler(stableHandler);

    // Connect if not connected
    if (!wsService.isConnected() && sessionId) {
      wsService.connect(sessionId).catch(err => {
        console.error('[WebSocket] Initial connection failed:', err);
        attemptReconnect();
      });
    }

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        if (!wsService.isConnected() && sessionId) {
          console.log('[WebSocket] Page visible, reconnecting...');
          reconnectAttempts.current = 0;
          wsService.connect(sessionId).catch(err => {
            console.error('[WebSocket] Reconnect on visible failed:', err);
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle online/offline events
    const handleOnline = () => {
      if (mountedRef.current && !wsService.isConnected() && sessionId) {
        console.log('[WebSocket] Network online, reconnecting...');
        reconnectAttempts.current = 0;
        wsService.connect(sessionId).catch(err => {
          console.error('[WebSocket] Reconnect on online failed:', err);
        });
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      mountedRef.current = false;
      wsService.removeMessageHandler(stableHandler);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [sessionId, stableHandler, attemptReconnect]);

  // Reconnect when dependencies change
  useEffect(() => {
    if (mountedRef.current && sessionId && dependencies.some(Boolean)) {
      reconnectAttempts.current = 0;
      if (!wsService.isConnected()) {
        wsService.connect(sessionId).catch(console.error);
      }
    }
  }, [sessionId, ...dependencies]);

  return {
    isConnected: wsService.isConnected(),
    sendMessage: wsService.sendMessage.bind(wsService)
  };
};
