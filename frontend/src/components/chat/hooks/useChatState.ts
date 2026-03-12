import { useState } from 'react';

export interface ChatState {
  inputText: string;
  showAttachmentMenu: boolean;
  isSendingFile: boolean;
  isConnected: boolean;
  encryptionReady: boolean;
  sessionEnded: boolean;
  isTerminatingProcess: boolean;
}

export const useChatState = () => {
  const [inputText, setInputText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [isTerminatingProcess, setIsTerminatingProcess] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  return {
    // State
    inputText,
    showAttachmentMenu,
    isSendingFile,
    isConnected,
    encryptionReady,
    isTerminatingProcess,
    sessionEnded,
    
    // Setters
    setInputText,
    setShowAttachmentMenu,
    setIsSendingFile,
    setIsConnected,
    setEncryptionReady,
    setIsTerminatingProcess,
    setSessionEnded,
  };
};
