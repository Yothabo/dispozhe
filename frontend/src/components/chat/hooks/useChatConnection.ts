import { useState, useEffect, useRef } from 'react';
import wsService from '../../../services/websocket';

type WebSocketMessage = {
  type: string;
  [key: string]: unknown;
};

export const useChatConnection = (sessionId: string, onMessage: (data: WebSocketMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectAttempted = useRef<boolean>(false);
  const handlerRegistered = useRef<boolean>(false);
  const connectionId = useRef<string>(`conn-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    if (!sessionId || connectAttempted.current) {
      return;
    }

    connectAttempted.current = true;

    // Check if already connected to this session
    if (wsService.isConnected() && wsService.getSessionId() === sessionId) {
      setIsConnected(true);
      return;
    }

    // Add message handler first
    if (!handlerRegistered.current) {
      wsService.addMessageHandler(onMessage);
      handlerRegistered.current = true;
    }

    // Then connect
    wsService.connect(sessionId)
      .then(() => {
        setIsConnected(true);
      })
      .catch((err: Error) => {
        console.error(`[${connectionId.current}] Connection failed:`, err);
        setIsConnected(false);
      });

    return () => {
      if (handlerRegistered.current) {
        wsService.removeMessageHandler(onMessage);
        handlerRegistered.current = false;
      }
      // Don't disconnect here - let the component unmount handle it
    };
  }, [sessionId, onMessage]);

  // Separate effect for monitoring connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = wsService.isConnected();
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return { isConnected };
};
