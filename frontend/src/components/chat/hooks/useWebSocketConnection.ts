import { useEffect, useRef } from 'react';
import wsService from '../../../services/websocket';

interface UseWebSocketConnectionProps {
  sessionId: string;
  isTerminating: boolean;
  terminationCompleted: boolean;
  showSecondUserTermination: boolean;
  onConnected: (connected: boolean) => void;
  connectionId: React.MutableRefObject<string>;
}

export const useWebSocketConnection = ({
  sessionId,
  isTerminating,
  terminationCompleted,
  showSecondUserTermination,
  onConnected,
  connectionId
}: UseWebSocketConnectionProps) => {
  const connectionEstablished = useRef<boolean>(false);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

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
        }
      } catch (err) {
        console.error(`[${connectionId.current}] WebSocket connection failed:`, err);
        connectionEstablished.current = false;

        if (mountedRef.current && !reconnectTimer.current) {
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
  }, [sessionId, isTerminating, terminationCompleted, showSecondUserTermination, onConnected, connectionId]);

  return {
    reconnectTimer
  };
};
