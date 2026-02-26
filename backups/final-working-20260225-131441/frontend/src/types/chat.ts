export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  readAt?: number;
  file?: {
    id: string;
    name: string;
    type: string;
    size: number;
    data: string;
    viewOnce: boolean;
    viewed?: boolean;
  };
}

export interface TypingIndicator {
  sessionId: string;
  isTyping: boolean;
}

export interface ReadReceipt {
  messageId: string;
  timestamp: number;
}
