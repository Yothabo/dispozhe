import { useEffect } from 'react';
import wsService from '../../../services/websocket';

interface UseChatEffectsProps {
  sessionId: string;
  encryptionInitialized: boolean;
  getKeyId: () => string;
  setEncryptionReady: (ready: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  isConnected: boolean;
  messages: any[];
  isTerminating: boolean;
  terminationCompleted: boolean;
  otherUserLeft: boolean;
  showSecondUserTermination: boolean;
  typingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  mountedRef: React.MutableRefObject<boolean>;
}

export const useChatEffects = ({
  sessionId,
  encryptionInitialized,
  getKeyId,
  setEncryptionReady,
  setIsConnected,
  isConnected,
  messages,
  isTerminating,
  terminationCompleted,
  otherUserLeft,
  showSecondUserTermination,
  typingTimeoutRef,
  mountedRef,
}: UseChatEffectsProps) => {
  useEffect(() => {
    if (encryptionInitialized) {
      setEncryptionReady(true);
      wsService.sendMessage({
        type: 'key_exchange',
        keyId: getKeyId(),
        timestamp: Date.now()
      });
    }
  }, [encryptionInitialized, getKeyId, setEncryptionReady]);

  useEffect(() => {
    const interval = setInterval(() => {
      const connected = wsService.isConnected();
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected, setIsConnected]);

  useEffect(() => {
    if (messages.length === 0 || isTerminating || terminationCompleted || otherUserLeft || showSecondUserTermination) {
      return;
    }
    const timeout = setTimeout(() => {
      sessionStorage.setItem(`Driflly_messages_${sessionId}`, JSON.stringify(messages));
    }, 500);
    return () => clearTimeout(timeout);
  }, [messages, sessionId, isTerminating, terminationCompleted, otherUserLeft, showSecondUserTermination]);

  useEffect(() => {
    mountedRef.current = true;
    const currentTypingTimeout = typingTimeoutRef.current;
    return () => {
      mountedRef.current = false;
      if (currentTypingTimeout) {
        clearTimeout(currentTypingTimeout);
      }
    };
  }, [typingTimeoutRef, mountedRef]);
};
