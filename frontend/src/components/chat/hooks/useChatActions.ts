import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import wsService from '../../../services/websocket';
import { setTerminatingState } from '../../../utils/preventRefresh';
import { notifyManagement } from '../../NotificationCenter';

interface UseChatActionsProps {
  sessionId: string;
  inputText: string;
  encryptionReady: boolean;
  isConnected: boolean;
  isTerminating: boolean;
  otherUserLeft: boolean;
  showSecondUserTermination: boolean;
  timeUp: boolean;
  sessionEnded: boolean;
  encryptionKey?: string;
  setInputText: (text: string) => void;
  setSessionEnded: (ended: boolean) => void;
  setIsTerminatingProcess: (value: boolean) => void;
  addMessage: (message: any) => void;
  prepareOutgoingMessage: (text: string, id: string) => any;
  sendTyping: (isTyping: boolean) => void;
  handleInitiatorTerminate: () => void;
}

export const useChatActions = ({
  inputText,
  encryptionReady,
  isConnected,
  isTerminating,
  otherUserLeft,
  showSecondUserTermination,
  timeUp,
  sessionEnded,
  setInputText,
  setSessionEnded,
  setIsTerminatingProcess,
  addMessage,
  prepareOutgoingMessage,
  sendTyping,
  handleInitiatorTerminate,
}: UseChatActionsProps) => {
  const navigate = useNavigate();

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !isConnected || !encryptionReady || isTerminating || otherUserLeft || showSecondUserTermination || timeUp || sessionEnded) {
      return;
    }

    const id = crypto.randomUUID();
    const wsMessage = prepareOutgoingMessage(inputText, id);

    addMessage({
      id,
      text: inputText,
      sender: 'me',
      timestamp: Date.now(),
      status: 'sent'
    });

    setInputText('');
    wsService.sendMessage(wsMessage);
    sendTyping(false);
  }, [inputText, isConnected, encryptionReady, isTerminating, otherUserLeft, showSecondUserTermination, timeUp, sessionEnded, prepareOutgoingMessage, addMessage, setInputText, sendTyping]);

  const confirmTerminate = useCallback(() => {
    setIsTerminatingProcess(true);
    wsService.setTerminating();
    setTerminatingState(true);
    setSessionEnded(true);
    setTimeout(() => {
      handleInitiatorTerminate();
    }, 50);
  }, [setIsTerminatingProcess, setSessionEnded, handleInitiatorTerminate]);

  const handleNewChat = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleDummyFileSelect = useCallback(() => {
    notifyManagement('This file type is not yet supported', 'info');
  }, []);

  return {
    handleSend,
    confirmTerminate,
    handleNewChat,
    handleClose,
    handleDummyFileSelect,
  };
};
