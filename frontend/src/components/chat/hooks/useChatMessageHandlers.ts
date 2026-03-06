import { useCallback, useMemo } from 'react';
import { Message } from '../types';
import { parseMessage } from '../utils/messageParser';
import { FileReconstructor } from '../utils/fileReconstructor';
import wsService, { WebSocketMessage } from '../../../services/websocket';
import { notifyManagement } from '../../NotificationCenter';

export const useChatMessageHandlers = (
  addMessage: (message: Message) => void,
  updateMessage: (id: string, updates: Partial<Message>) => void,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  processedIds: React.MutableRefObject<Set<string>>,
  viewedFiles: React.MutableRefObject<Set<string>>,
  setOtherUserLeft?: (value: boolean) => void,
  handleTimeUpMessage?: () => void,
  handleTypingIndicator?: (data: { isTyping: boolean }) => void
) => {
  const fileReconstructor = useMemo(() => new FileReconstructor(), []);

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

  const handleFileChunk = useCallback((data: WebSocketMessage) => {
    if (!data.fileId || typeof data.chunkIndex !== 'number' || !data.totalChunks || !data.fileName || !data.chunk) return;
    const totalChunks = data.totalChunks as number;
    const fileMessage = fileReconstructor.addChunk({
      fileId: data.fileId as string,
      chunkIndex: data.chunkIndex,
      totalChunks: totalChunks,
      chunk: data.chunk as string,
      fileName: data.fileName as string,
      fileType: data.fileType as string || '',
      timestamp: data.timestamp as number || Date.now()
    });
    if (fileMessage) {
      addMessage({
        id: data.fileId as string,
        text: `[File] ${data.fileName}`,
        sender: 'them',
        timestamp: data.timestamp as number || Date.now(),
        status: 'delivered',
        file: fileMessage
      });
      wsService.sendMessage({ type: 'read', messageId: data.fileId, timestamp: Date.now() });
    }
  }, [addMessage, fileReconstructor]);

  const handleFile = useCallback((data: WebSocketMessage) => {
    if (!data.id || !data.file) return;
    if (processedIds.current.has(data.id as string)) return;
    processedIds.current.add(data.id as string);

    const isViewed = viewedFiles.current.has(data.id as string);

    addMessage({
      id: data.id as string,
      text: `[File] ${(data.file as { name: string }).name}${isViewed ? ' (viewed)' : ''}`,
      sender: 'them',
      timestamp: data.timestamp as number || Date.now(),
      status: 'delivered',
      file: {
        id: data.id as string,
        name: (data.file as { name: string }).name,
        type: (data.file as { type: string }).type,
        size: (data.file as { size: number }).size,
        data: isViewed ? '' : (data.file as { data: string }).data,
        viewOnce: true,
        viewed: isViewed
      }
    });

    wsService.sendMessage({ type: 'read', messageId: data.id, timestamp: Date.now() });
  }, [addMessage, processedIds, viewedFiles]);

  const handleTextMessage = useCallback((data: WebSocketMessage) => {
    if (!data.id || !data.data) return;
    if (processedIds.current.has(data.id as string)) return;
    try {
      const decoded = parseMessage(data.data as string);
      processedIds.current.add(data.id as string);
      addMessage({
        id: data.id as string,
        text: decoded,
        sender: 'them',
        timestamp: data.timestamp as number || Date.now(),
        status: 'delivered'
      });
      wsService.sendMessage({ type: 'read', messageId: data.id, timestamp: Date.now() });
    } catch (e) {
      console.error('Failed to decrypt:', e);
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

  const handleFileViewed = useCallback((data: WebSocketMessage) => {
    if (!data.messageId) return;
    viewedFiles.current.add(data.messageId as string);
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
        handleTyping(data);
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
        break;
    }
  }, [
    handleParticipantLeaving,
    handleParticipantLeft,
    handleTimeUpMessage,
    handleFileChunk,
    handleFile,
    handleTextMessage,
    handleTyping,
    handleRead,
    handleDelivered,
    handleFileViewed
  ]);

  return { handleMessage };
};
