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
      console.log(`[${connectionId.current}] Connection already established or component terminating`);
      return;
    }

    console.log(`[${connectionId.current}] Connecting to session:`, sessionId);
    connectionEstablished.current = true;

    const connect = async () => {
      try {
        await wsService.connect(sessionId);
        if (mountedRef.current) {
          onConnected(true);
          console.log(`[${connectionId.current}] WebSocket connected successfully`);
        }
      } catch (err) {
        console.error(`[${connectionId.current}] WebSocket connection failed:`, err);
        connectionEstablished.current = false;

        if (mountedRef.current && !reconnectTimer.current) {
          console.log(`[${connectionId.current}] Scheduling reconnect...`);
          reconnectTimer.current = setTimeout(() => {
            console.log(`[${connectionId.current}] Reconnecting...`);
            reconnectTimer.current = null;
            connectionEstablished.current = false;
          }, 3000);
        }
      }
    };

    connect();

    return () => {
      console.log(`[${connectionId.current}] Cleanup - DO NOT disconnect WebSocket here`);
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
