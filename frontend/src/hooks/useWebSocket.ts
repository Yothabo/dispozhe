import { useEffect, useRef } from 'react';
import wsService from '../services/websocket';

export const useWebSocket = (
  sessionId: string,
  onMessage: (data: any) => void
) => {
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!sessionId) return;

    wsService.addMessageHandler(handlerRef.current);
    
    if (!wsService.isConnected() || wsService.getSessionId() !== sessionId) {
      wsService.connect(sessionId).catch(console.error);
    }

    return () => {
      wsService.removeMessageHandler(handlerRef.current);
    };
  }, [sessionId]);
};
