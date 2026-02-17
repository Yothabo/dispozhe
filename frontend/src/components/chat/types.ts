export interface FileMessage {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
  viewOnce: boolean;
  viewed?: boolean;
}

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them' | 'system';
  timestamp: number;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  file?: FileMessage;
}

export interface TerminationStep {
  id: number;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}
