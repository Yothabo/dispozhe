import { useEffect, useRef } from 'react';
import wsService from '../../../services/websocket';

interface UseMessageHandlerProps {
  isTerminating: boolean;
  terminationCompleted: boolean;
  showSecondUserTermination: boolean;
  onMessage: (message: any) => void;
  connectionId: React.MutableRefObject<string>;
}

export const useMessageHandler = ({
  isTerminating,
  terminationCompleted,
  showSecondUserTermination,
  onMessage,
  connectionId
}: UseMessageHandlerProps) => {
  const handlerRegistered = useRef<boolean>(false);

  useEffect(() => {
    if (!handlerRegistered.current && !isTerminating && !terminationCompleted && !showSecondUserTermination) {
      console.log(`[${connectionId.current}] Adding message handler`);
      wsService.addMessageHandler(onMessage);
      handlerRegistered.current = true;
    }
    return () => {
      if (handlerRegistered.current) {
        console.log(`[${connectionId.current}] Removing message handler`);
        wsService.removeMessageHandler(onMessage);
        handlerRegistered.current = false;
      }
    };
  }, [onMessage, isTerminating, terminationCompleted, showSecondUserTermination, connectionId]);
};
