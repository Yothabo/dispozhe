import { useState, useRef, useCallback } from 'react';
import { Message } from '../types';

export const useChatMessages = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem(`Driflly_messages_${sessionId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const processedIds = useRef<Set<string>>(new Set());
  const viewedFiles = useRef<Set<string>>(new Set());

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessageStatus = useCallback((id: string, status: 'sending' | 'sent' | 'delivered' | 'read') => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, status } : msg
    ));
  }, []);

  const markFileAsViewed = useCallback((fileId: string) => {
    viewedFiles.current.add(fileId);
    setMessages(prev => prev.map(msg => {
      if (msg.file?.id === fileId && msg.sender === 'them') {
        return {
          ...msg,
          file: { ...msg.file, viewed: true },
          text: `[File] ${msg.file.name} (viewed)`
        };
      }
      return msg;
    }));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    otherUserTyping,
    setOtherUserTyping,
    addMessage,
    updateMessageStatus,
    markFileAsViewed,
    processedIds,
    viewedFiles,
    clearMessages
  };
};
