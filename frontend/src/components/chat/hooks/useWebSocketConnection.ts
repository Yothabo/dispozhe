import { useEffect, useRef } from 'react';
import wsService from '../../../services/websocket';

interface UseWebSocketConnectionProps {
  sessionId: string;
  isTerminating: boolean;
  terminationCompleted: boolean;
  showSecondUserTermination: boolean;
  onConnected: (connected: boolean) => void;
  onReconnecting?: (attempt: number) => void;
  connectionId: React.MutableRefObject<string>;
}

export const useWebSocketConnection = ({
  sessionId,
  isTerminating,
  terminationCompleted,
  showSecondUserTermination,
  onConnected,
  onReconnecting,
  connectionId
}: UseWebSocketConnectionProps) => {
  const connectionEstablished = useRef<boolean>(false);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const reconnectAttemptRef = useRef<number>(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (connectionEstablished.current || isTerminating || terminationCompleted || showSecondUserTermination) {
      return;
    }

    connectionEstablished.current = true;

    const connect = async () => {
      try {
        await wsService.connect(sessionId);
        if (mountedRef.current) {
          onConnected(true);
          reconnectAttemptRef.current = 0;
        }
      } catch (err) {
        console.error(`[${connectionId.current}] WebSocket connection failed:`, err);
        connectionEstablished.current = false;

        if (mountedRef.current && !reconnectTimer.current) {
          reconnectAttemptRef.current++;
          if (onReconnecting) {
            onReconnecting(reconnectAttemptRef.current);
          }
          
          reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connectionEstablished.current = false;
          }, 3000);
        }
      }
    };

    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [sessionId, isTerminating, terminationCompleted, showSecondUserTermination, onConnected, onReconnecting, connectionId]);

  return {
    reconnectTimer
  };
};
