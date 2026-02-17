import { useState, useRef, useCallback } from 'react';
import wsService from '../../../services/websocket';

export const useChatTyping = () => {
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const lastTypingSent = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendTyping = useCallback((isTyping: boolean) => {
    wsService.sendMessage({ type: 'typing', isTyping, timestamp: Date.now() });
  }, []);

  const handleTyping = useCallback((
    e: React.ChangeEvent<HTMLInputElement>, 
    isTerminating: boolean, 
    otherUserLeft: boolean, 
    showSecondUserTermination: boolean, 
    timeUp: boolean,
    setInputText: (value: string) => void
  ) => {
    if (isTerminating || otherUserLeft || showSecondUserTermination || timeUp) return;
    
    const value = e.target.value;
    setInputText(value);
    
    const now = Date.now();
    if (value.length > 0) {
      if (now - lastTypingSent.current > 2000) {
        wsService.sendMessage({ type: 'typing', isTyping: true, timestamp: now });
        lastTypingSent.current = now;
      }
    } else {
      wsService.sendMessage({ type: 'typing', isTyping: false, timestamp: now });
    }
  }, []);

  const handleTypingIndicator = useCallback((data: any) => {
    setOtherUserTyping(data.isTyping);
    if (data.isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
    }
  }, []);

  return {
    otherUserTyping,
    setOtherUserTyping,
    lastTypingSent,
    typingTimeoutRef,
    sendTyping,
    handleTyping,
    handleTypingIndicator
  };
};
