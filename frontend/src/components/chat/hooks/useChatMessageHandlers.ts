import { useCallback } from 'react';
import { Message } from '../types';
import { parseMessage } from '../utils/messageParser';
import wsService, { WebSocketMessage } from '../../../services/websocket';
import { notifyManagement } from '../../NotificationCenter';

export const useChatMessageHandlers = (
  addMessage: (message: Message) => void,
  updateMessage: (id: string, updates: Partial<Message>) => void,
  _setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  processedIds: React.MutableRefObject<Set<string>>,
  _viewedFiles: React.MutableRefObject<Set<string>>,
  setOtherUserLeft?: (value: boolean) => void,
  handleTimeUpMessage?: () => void,
  handleTypingIndicator?: (data: { isTyping: boolean }) => void
) => {
  const handleParticipantLeaving = useCallback(() => {
    if (setOtherUserLeft) {
      setOtherUserLeft(true);
    }
    addMessage({
      id: `system-${Date.now()}`,
      text: 'The other participant has left the chat.',
      sender: 'system',
      timestamp: Date.now()
    });
    notifyManagement('Other participant left the chat', 'warning');
  }, [addMessage, setOtherUserLeft]);

  const handleTextMessage = useCallback((data: WebSocketMessage) => {
    if (!data.id || !data.data) {
      return;
    }
    if (processedIds.current.has(data.id as string)) {
      return;
    }
    try {
      const decoded = typeof data.data === 'string' ? data.data : parseMessage(data.data as string);
      processedIds.current.add(data.id as string);
      addMessage({
        id: data.id as string,
        text: decoded,
        sender: 'them',
        timestamp: data.timestamp as number || Date.now(),
        status: 'delivered'
      });
      wsService.sendMessage({
        type: 'read',
        messageId: data.id,
        timestamp: Date.now()
      });
    } catch {
      // Silently fail - message will be retried or shown as error
    }
  }, [addMessage, processedIds]);

  const handleRead = useCallback((data: WebSocketMessage) => {
    if (data.messageId) {
      updateMessage(data.messageId as string, { status: 'read' });
    }
  }, [updateMessage]);

  const handleDelivered = useCallback((data: WebSocketMessage) => {
    if (data.messageId) {
      updateMessage(data.messageId as string, { status: 'delivered' });
    }
  }, [updateMessage]);

  const handleParticipantLeft = useCallback((data: WebSocketMessage) => {
    if (setOtherUserLeft) {
      setOtherUserLeft(true);
    }
    addMessage({
      id: `system-${Date.now()}`,
      text: 'The other participant has left the chat.',
      sender: 'system',
      timestamp: data.timestamp as number || Date.now()
    });
    notifyManagement('Other participant left the chat', 'warning');
  }, [addMessage, setOtherUserLeft]);

  const handleTyping = useCallback((data: WebSocketMessage) => {
    if (handleTypingIndicator && data.isTyping !== undefined) {
      handleTypingIndicator({ isTyping: data.isTyping as boolean });
    }
  }, [handleTypingIndicator]);

  const handleMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'participant_leaving':
        handleParticipantLeaving();
        break;
      case 'participant_left':
        handleParticipantLeft(data);
        break;
      case 'time_up':
        handleTimeUpMessage?.();
        break;
      case 'message':
        handleTextMessage(data);
        break;
      case 'typing':
        handleTyping(data);
        break;
      case 'read':
        handleRead(data);
        break;
      case 'delivered':
        handleDelivered(data);
        break;
      default:
        break;
    }
  }, [
    handleParticipantLeaving,
    handleParticipantLeft,
    handleTimeUpMessage,
    handleTextMessage,
    handleTyping,
    handleRead,
    handleDelivered
  ]);

  return { handleMessage };
};
