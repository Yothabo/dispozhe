import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { Message, FileMessage } from '../types';
import wsService from '../../../services/websocket';
import { notifyManagement } from '../../NotificationCenter';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const useFileHandling = (
  addMessage: (message: Message) => void,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  viewedFiles: React.MutableRefObject<Set<string>>,
  mountedRef: React.MutableRefObject<boolean>,
  setIsSendingFile: (value: boolean) => void,
  onClosePicker?: () => void
) => {
  const [previewFile, setPreviewFile] = useState<FileMessage | null>(null);
  const [sendingFile, setSendingFile] = useState(false);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    setIsSendingFile(true);
    setSendingFile(true);

    if (onClosePicker) {
      onClosePicker();
    }

    try {
      let fileToSend = file;

      if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };

        try {
          fileToSend = await imageCompression(file, options);
        } catch {
          fileToSend = file;
        }
      }

      const reader = new FileReader();

      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileToSend);
      });

      const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const timestamp = Date.now();

      addMessage({
        id,
        text: `Sending ${fileToSend.name}...`,
        sender: 'me',
        timestamp,
        status: 'sending'
      });

      if (!wsService.isConnected()) {
        throw new Error('WebSocket not connected');
      }

      const message = {
        type: 'file',
        id,
        file: {
          name: fileToSend.name,
          type: fileToSend.type,
          size: fileToSend.size,
          data: base64Data,
          viewOnce: true
        },
        timestamp
      };

      const sent = wsService.sendMessage(message);

      if (!sent) {
        throw new Error('Failed to send message - WebSocket send failed');
      }

      if (mountedRef.current) {
        setTimeout(() => {
          setMessages(prev => prev.map(msg =>
            msg.id === id ? {
              ...msg,
              text: `You sent: ${fileToSend.name}`,
              status: 'sent'
            } : msg
          ));
          setIsSendingFile(false);
          setSendingFile(false);
        }, 500);
      }

    } catch (error) {
      console.error('File send failed:', error);
      alert('Failed to send file. Please try again.');
      setIsSendingFile(false);
      setSendingFile(false);
      notifyManagement('File send failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }, [addMessage, setMessages, mountedRef, setIsSendingFile, onClosePicker]);

  const handleViewFile = useCallback((message: Message) => {
    if (!message.file) {
      return;
    }

    if (viewedFiles.current.has(message.id)) {
      notifyManagement('This file can only be viewed once', 'info');
      return;
    }

    setPreviewFile(message.file);

    if (message.sender === 'them' && message.file.viewOnce && !message.file.viewed) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === message.id && msg.file) {
          return {
            ...msg,
            file: { ...msg.file, viewed: true },
            text: `[File] ${msg.file.name} (viewed)`
          };
        }
        return msg;
      }));

      wsService.sendMessage({
        type: 'file_viewed',
        messageId: message.id,
        timestamp: Date.now()
      });

      viewedFiles.current.add(message.id);
    }
  }, [setMessages, viewedFiles]);

  const handleFileViewed = useCallback((fileId: string) => {
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

    wsService.sendMessage({
      type: 'file_viewed',
      messageId: fileId,
      timestamp: Date.now()
    });
  }, [setMessages, viewedFiles]);

  return {
    previewFile,
    setPreviewFile,
    handleFileSelect,
    handleViewFile,
    handleFileViewed,
    isSendingFile: sendingFile
  };
};
