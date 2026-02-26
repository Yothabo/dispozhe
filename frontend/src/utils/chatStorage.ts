import { Message } from '../components/chat/types';

export const saveMessagesToStorage = (sessionId: string, messages: Message[]) => {
  if (messages.length === 0) return;
  
  const timeout = setTimeout(() => {
    sessionStorage.setItem(`Driflly_messages_${sessionId}`, JSON.stringify(messages));
  }, 500);

  return () => clearTimeout(timeout);
};

export const loadMessagesFromStorage = (sessionId: string): Message[] | null => {
  const stored = sessionStorage.getItem(`Driflly_messages_${sessionId}`);
  return stored ? JSON.parse(stored) : null;
};

export const clearMessagesFromStorage = (sessionId: string) => {
  sessionStorage.removeItem(`Driflly_messages_${sessionId}`);
};
