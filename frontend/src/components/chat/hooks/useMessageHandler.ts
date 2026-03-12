import { useEffect, useRef } from 'react';
import wsService, { WebSocketMessage } from '../../../services/websocket';

interface UseMessageHandlerProps {
  onMessage: (message: WebSocketMessage) => void;
}

export const useMessageHandler = ({ onMessage }: UseMessageHandlerProps) => {
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const handler = (data: WebSocketMessage) => {
      handlerRef.current(data);
    };

    wsService.addMessageHandler(handler);
    return () => wsService.removeMessageHandler(handler);
  }, []);
};
