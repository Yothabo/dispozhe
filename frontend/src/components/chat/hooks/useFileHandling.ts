import { useState, useCallback, useRef } from 'react';
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

    // Reset input to allow selecting same file again
    e.target.value = '';

    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    setIsSendingFile(true);
    setSendingFile(true);

    // Close the attachment picker immediately
    if (onClosePicker) {
      onClosePicker();
    }

    try {
      let fileToSend = file;

      // Compress images if they're large
      if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };

        try {
          fileToSend = await imageCompression(file, options);
          console.log(`[Image] Compressed from ${(file.size/1024/1024).toFixed(2)}MB to ${(fileToSend.size/1024/1024).toFixed(2)}MB`);
        } catch (compressionError) {
          console.error('Compression failed, sending original:', compressionError);
          fileToSend = file;
        }
      }

      // Convert to base64
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

      // Add sending message
      addMessage({
        id,
        text: `Sending ${fileToSend.name}...`,
        sender: 'me',
        timestamp,
        status: 'sending'
      });

      // Check WebSocket connection before sending
      if (!wsService.isConnected()) {
        throw new Error('WebSocket not connected');
      }

      // Send file via WebSocket
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

      console.log('[FileHandling] Sending file:', message);
      const sent = wsService.sendMessage(message);

      if (!sent) {
        throw new Error('Failed to send message - WebSocket send failed');
      }

      // Update message status after successful send
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
    console.log('[FileHandling] handleViewFile called for message:', message.id);
    
    if (!message.file) {
      console.log('[FileHandling] No file in message');
      return;
    }
    
    // Check if file has already been viewed
    if (viewedFiles.current.has(message.id)) {
      console.log('[FileHandling] File already viewed:', message.id);
      notifyManagement('This file can only be viewed once', 'info');
      return;
    }
    
    // Always open the preview modal first
    console.log('[FileHandling] Opening preview for file:', message.file.name);
    setPreviewFile(message.file);
    
    // Then mark as viewed if it's from them and viewOnce
    if (message.sender === 'them' && message.file.viewOnce && !message.file.viewed) {
      console.log('[FileHandling] Marking file as viewed:', message.id);
      
      // Update local state
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
      
      // Notify sender
      wsService.sendMessage({ 
        type: 'file_viewed', 
        messageId: message.id, 
        timestamp: Date.now() 
      });
      
      // Add to viewed set
      viewedFiles.current.add(message.id);
    }
  }, [setMessages, viewedFiles]);

  const handleFileViewed = useCallback((fileId: string) => {
    console.log('[FileHandling] File viewed callback:', fileId);
    
    // Add to viewed set
    viewedFiles.current.add(fileId);
    
    // Update message in UI
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
