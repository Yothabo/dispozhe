import { useCallback } from 'react';
import { Message } from '../types';
import { parseMessage } from '../utils/messageParser';
import { FileReconstructor } from '../utils/fileReconstructor';
import wsService from '../../../services/websocket';
import { notifyManagement } from '../../NotificationCenter';

export const useChatMessageHandlers = (
  addMessage: (message: Message) => void,
  updateMessage: (id: string, updates: Partial<Message>) => void,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  processedIds: React.MutableRefObject<Set<string>>,
  viewedFiles: React.MutableRefObject<Set<string>>,
  setOtherUserLeft?: (value: boolean) => void,
  handleTimeUpMessage?: () => void,
  handleTypingIndicator?: (data: any) => void
) => {
  const fileReconstructor = new FileReconstructor();

  const handleParticipantLeaving = useCallback(() => {
    if (setOtherUserLeft) {
      setOtherUserLeft(true);
    }
    addMessage({
      id: `system-${Date.now()}`,
      text: 'The other participant has ended the chat.',
      sender: 'system',
      timestamp: Date.now()
    });
    notifyManagement('Other participant left the chat', 'warning');
  }, [addMessage, setOtherUserLeft]);

  const handleFileChunk = useCallback((data: any) => {
    const fileMessage = fileReconstructor.addChunk(data);
    if (fileMessage) {
      addMessage({
        id: data.fileId,
        text: `[File] ${data.fileName}`,
        sender: 'them',
        timestamp: data.timestamp || Date.now(),
        status: 'delivered',
        file: fileMessage
      });
      wsService.sendMessage({ type: 'read', messageId: data.fileId, timestamp: Date.now() });
    }
  }, [addMessage]);

  const handleFile = useCallback((data: any) => {
    if (data.id && processedIds.current.has(data.id)) return;
    processedIds.current.add(data.id);

    const isViewed = viewedFiles.current.has(data.id);
    
    console.log('[MessageHandlers] Received file:', data.file.name);
    
    addMessage({
      id: data.id,
      text: `[File] ${data.file.name}${isViewed ? ' (viewed)' : ''}`,
      sender: 'them',
      timestamp: data.timestamp || Date.now(),
      status: 'delivered',
      file: {
        id: data.id,
        name: data.file.name,
        type: data.file.type,
        size: data.file.size,
        data: isViewed ? '' : data.file.data,
        viewOnce: true,
        viewed: isViewed
      }
    });
    
    wsService.sendMessage({ type: 'read', messageId: data.id, timestamp: Date.now() });
  }, [addMessage, processedIds, viewedFiles]);

  const handleTextMessage = useCallback((data: any) => {
    if (data.id && processedIds.current.has(data.id)) return;
    try {
      const decoded = parseMessage(data.data);
      processedIds.current.add(data.id);
      addMessage({
        id: data.id,
        text: decoded,
        sender: 'them',
        timestamp: data.timestamp || Date.now(),
        status: 'delivered'
      });
      wsService.sendMessage({ type: 'read', messageId: data.id, timestamp: Date.now() });
    } catch (e) { console.error('Failed to decrypt:', e); }
  }, [addMessage, processedIds]);

  const handleRead = useCallback((data: any) => {
    updateMessage(data.messageId, { status: 'read' });
  }, [updateMessage]);

  const handleDelivered = useCallback((data: any) => {
    updateMessage(data.messageId, { status: 'delivered' });
  }, [updateMessage]);

  const handleFileViewed = useCallback((data: any) => {
    viewedFiles.current.add(data.messageId);
    setMessages(prev => prev.map(msg => {
      if (msg.id === data.messageId && msg.file) {
        return {
          ...msg,
          file: {
            ...msg.file,
            viewed: true,
            data: ''
          },
          text: `[File] ${msg.file.name} (viewed)`
        };
      }
      return msg;
    }));
  }, [setMessages, viewedFiles]);

  const handleMessage = useCallback((data: any) => {
    console.log('[MessageHandlers] Received:', data.type);
    
    switch (data.type) {
      case 'participant_leaving':
        handleParticipantLeaving();
        break;
      case 'time_up':
        handleTimeUpMessage?.();
        break;
      case 'file_chunk':
        handleFileChunk(data);
        break;
      case 'file':
        handleFile(data);
        break;
      case 'message':
        handleTextMessage(data);
        break;
      case 'typing':
        handleTypingIndicator?.(data);
        break;
      case 'read':
        handleRead(data);
        break;
      case 'delivered':
        handleDelivered(data);
        break;
      case 'file_viewed':
        handleFileViewed(data);
        break;
      default:
        console.log('[MessageHandlers] Unknown message type:', data.type);
    }
  }, [
    handleParticipantLeaving,
    handleTimeUpMessage,
    handleFileChunk,
    handleFile,
    handleTextMessage,
    handleTypingIndicator,
    handleRead,
    handleDelivered,
    handleFileViewed
  ]);

  return { handleMessage };
};
