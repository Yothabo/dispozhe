import { useState, useRef, useCallback } from 'react';
import { Message, FileMessage } from '../types';
import wsService from '../../../services/websocket';

export const useChatMessages = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem(`Driflly_messages_${sessionId}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const processedIds = useRef<Set<string>>(new Set());
  const fileChunks = useRef<{[key: string]: {
    chunks: string[];
    totalChunks: number;
    fileName: string;
    fileType: string;
    timestamp: number;
  }}>({});
  const viewedFiles = useRef<Set<string>>(new Set());

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const handleIncomingMessage = useCallback((data: any) => {
    if (data.id && processedIds.current.has(data.id)) return;
    
    if (data.type === 'message' && data.data) {
      try {
        const binary = atob(data.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const decoder = new TextDecoder();
        const decoded = decoder.decode(bytes);

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
    }

    if (data.type === 'file' && data.file) {
      if (data.id && processedIds.current.has(data.id)) return;
      processedIds.current.add(data.id);

      const isViewed = viewedFiles.current.has(data.id);
      
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
    }

    if (data.type === 'file_chunk') {
      if (!fileChunks.current[data.fileId]) {
        fileChunks.current[data.fileId] = {
          chunks: [],
          totalChunks: data.totalChunks,
          fileName: data.fileName,
          fileType: data.fileType,
          timestamp: data.timestamp
        };
      }

      fileChunks.current[data.fileId].chunks[data.chunkIndex] = data.chunk;

      if (fileChunks.current[data.fileId].chunks.length === data.totalChunks &&
          fileChunks.current[data.fileId].chunks.every(c => c !== undefined)) {

        const fileData = fileChunks.current[data.fileId];
        const completeBase64 = fileData.chunks.join('');

        addMessage({
          id: data.fileId,
          text: `[File] ${data.fileName}`,
          sender: 'them',
          timestamp: data.timestamp || Date.now(),
          status: 'delivered',
          file: {
            id: data.fileId,
            name: data.fileName,
            type: data.fileType,
            size: Math.round(completeBase64.length * 0.75),
            data: completeBase64,
            viewOnce: true,
            viewed: false
          }
        });
        wsService.sendMessage({ type: 'read', messageId: data.fileId, timestamp: Date.now() });

        delete fileChunks.current[data.fileId];
      }
    }

    if (data.type === 'read' && data.messageId) {
      updateMessage(data.messageId, { status: 'read' });
    }

    if (data.type === 'delivered' && data.messageId) {
      updateMessage(data.messageId, { status: 'delivered' });
    }

    if (data.type === 'file_viewed' && data.messageId) {
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
    }
  }, [addMessage, updateMessage]);

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
    wsService.sendMessage({ type: 'file_viewed', messageId: fileId, timestamp: Date.now() });
  }, []);

  return {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    handleIncomingMessage,
    markFileAsViewed,
    processedIds,
    fileChunks,
    viewedFiles
  };
};
