import { useState, useEffect, useRef } from 'react';
import wsService from '../../../services/websocket';

export const useChatConnection = (sessionId: string, onMessage: (data: any) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectAttempted = useRef<boolean>(false);
  const handlerRegistered = useRef<boolean>(false);

  useEffect(() => {
    if (!sessionId || connectAttempted.current) return;

    connectAttempted.current = true;
    console.log('[ActiveChat] Attempting to connect to session:', sessionId);

    if (wsService.isConnected() && wsService.getSessionId() === sessionId) {
      console.log('[ActiveChat] Already connected');
      setIsConnected(true);
      return;
    }

    wsService.connect(sessionId)
      .then(() => {
        console.log('[ActiveChat] Connected successfully');
        setIsConnected(true);
      })
      .catch((err) => {
        console.error('[ActiveChat] Connection failed:', err);
        setIsConnected(false);
      });

    return () => {
      console.log('[ActiveChat] Cleanup');
    };
  }, [sessionId]);

  useEffect(() => {
    if (!handlerRegistered.current && !isConnected) {
      wsService.addMessageHandler(onMessage);
      handlerRegistered.current = true;
    }
    return () => {
      if (handlerRegistered.current) {
        wsService.removeMessageHandler(onMessage);
        handlerRegistered.current = false;
      }
    };
  }, [isConnected, onMessage]);

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
