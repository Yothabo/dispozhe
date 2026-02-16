import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaPaperclip, FaPaperPlane, FaTrash } from 'react-icons/fa';
import { preventChatReload } from '../../utils/preventReload';
import { preventRefresh, disableRefreshKeys } from '../../utils/preventRefresh';
import api from '../../services/api';
import wsService from '../../services/websocket';
import useKeyboard from '../../hooks/useKeyboard';
import { useTimer } from '../../hooks/useTimer';

// Components
import ChatHeader from './header/ChatHeader';
import ChatInput from './input/ChatInput';
import MessageBubble from './messages/MessageBubble';
import FileViewer from './file/FileViewer';
import AttachmentMenu from './file/AttachmentMenu';
import TypingIndicator from './TypingIndicator';
import TerminationModal from './termination/TerminationModal';

// Termination Views
import DestroyingSessionView from './termination/views/DestroyingSessionView';
import SessionDestroyedView from './termination/views/SessionDestroyedView';

interface ActiveChatProps {
  sessionId: string;
  duration: number;
  encryptionKey: string;
  onTerminate: () => void;
  onCreateNew?: () => void;
}

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

const MAX_MESSAGES = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ActiveChat: React.FC<ActiveChatProps> = ({
  sessionId,
  duration,
  encryptionKey,
  onTerminate,
  onCreateNew
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem(`chatlly_messages_${sessionId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileMessage | null>(null);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [terminationCompleted, setTerminationCompleted] = useState(false);
  const [otherUserLeft, setOtherUserLeft] = useState(false);
  const [showSecondUserTermination, setShowSecondUserTermination] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [secondUserSteps, setSecondUserSteps] = useState<TerminationStep[]>([
    { id: 1, label: 'Session terminated by other user', status: 'pending' },
    { id: 2, label: 'Encryption keys destroyed', status: 'pending' },
    { id: 3, label: 'Session data cleared from server', status: 'pending' },
    { id: 4, label: 'Encrypted tunnel closed', status: 'pending' },
    { id: 5, label: 'All traces purged', status: 'pending' }
  ]);

  const [terminationSteps, setTerminationSteps] = useState<TerminationStep[]>([
    { id: 1, label: 'Destroy session link', status: 'pending' },
    { id: 2, label: 'Wipe encryption keys from memory', status: 'pending' },
    { id: 3, label: 'Clear session data from server', status: 'pending' },
    { id: 4, label: 'Close encrypted tunnel', status: 'pending' },
    { id: 5, label: 'Purge all traces from database', status: 'pending' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const processedIds = useRef<Set<string>>(new Set());
  const lastTypingSent = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitiator = useRef<boolean>(sessionStorage.getItem(`chatlly_initiator_${sessionId}`) === 'true');
  const handlerRegistered = useRef<boolean>(false);
  const mountedRef = useRef(true);
  const animationTimeouts = useRef<NodeJS.Timeout[]>([]);
  const connectAttempted = useRef<boolean>(false);
  const terminationMessageShown = useRef<boolean>(false);
  const timeUpMessageShown = useRef<boolean>(false);

  const keyboardHeight = useKeyboard();

  // Simple timer - when time's up, show system message
  const handleTimeUp = useCallback(() => {
    if (timeUpMessageShown.current || timeUp) return;
    timeUpMessageShown.current = true;
    setTimeUp(true);
    
    // Add system message that time is up
    const timeUpMessage: Message = {
      id: `timeup-${Date.now()}`,
      text: 'Chat duration has ended. Please terminate the session.',
      sender: 'system',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, timeUpMessage]);
    
    // Notify other user that time is up
    if (isConnected) {
      wsService.sendMessage({ type: 'time_up', timestamp: Date.now() });
    }
  }, [isConnected, timeUp]);

  const { timeLeft, formatTime, stopTimer } = useTimer(
    duration * 60,
    handleTimeUp
  );

  // Handle time_up message from other user
  const handleTimeUpMessage = useCallback(() => {
    if (timeUpMessageShown.current || timeUp) return;
    timeUpMessageShown.current = true;
    setTimeUp(true);
    
    // Add system message that time is up
    const timeUpMessage: Message = {
      id: `timeup-${Date.now()}`,
      text: 'Chat duration has ended. Please terminate the session.',
      sender: 'system',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, timeUpMessage]);
  }, [timeUp]);

  // Prevent refresh during active chat
  useEffect(() => {
    if (!terminationCompleted && !showSecondUserTermination && !isTerminating) {
      const cleanupRefresh = preventRefresh("Refreshing will disconnect you from the chat. Are you sure?");
      const cleanupKeys = disableRefreshKeys();
      
      return () => {
        cleanupRefresh();
        cleanupKeys();
      };
    }
  }, [terminationCompleted, showSecondUserTermination, isTerminating]);

  // Save messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0 && !isTerminating && !terminationCompleted && !otherUserLeft && !showSecondUserTermination) {
      sessionStorage.setItem(`chatlly_messages_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId, isTerminating, terminationCompleted, otherUserLeft, showSecondUserTermination]);

  // Connect on mount
  useEffect(() => {
    if (!sessionId || connectAttempted.current || terminationCompleted || showSecondUserTermination) return;
    
    connectAttempted.current = true;
    console.log('[ActiveChat] Attempting to connect to session:', sessionId);
    
    if (wsService.isConnected() && wsService.getSessionId() === sessionId) {
      console.log('[ActiveChat] Already connected');
      setIsConnected(true);
      return;
    }

    wsService.connect(sessionId)
      .then(() => {
        console.log('[ActiveChat] Connected successfully');
        setIsConnected(true);
      })
      .catch((err) => {
        console.error('[ActiveChat] Connection failed:', err);
        setIsConnected(false);
      });

    return () => {
      console.log('[ActiveChat] Cleanup');
    };
  }, [sessionId, terminationCompleted, showSecondUserTermination]);

  // Update connection status
  useEffect(() => {
    if (terminationCompleted || showSecondUserTermination) return;
    
    const interval = setInterval(() => {
      const connected = wsService.isConnected();
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected, terminationCompleted, showSecondUserTermination]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      animationTimeouts.current.forEach(clearTimeout);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Initiator's termination sequence (actual server termination)
  const handleInitiatorTerminateSequence = useCallback(() => {
    if (isTerminating || terminationCompleted || otherUserLeft || showSecondUserTermination) return;
    
    setIsTerminating(true);
    setShowTerminateModal(false);
    
    // Stop timer
    stopTimer();
    
    // Clear messages from storage
    sessionStorage.removeItem(`chatlly_messages_${sessionId}`);
    
    // Reset steps to pending
    setTerminationSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    // Notify other user that we're leaving
    try {
      wsService.sendMessage({ type: 'participant_leaving', timestamp: Date.now() });
    } catch (e) {
      // Ignore errors - we're terminating anyway
    }

    // Animate through each step
    terminationSteps.forEach((item, index) => {
      const timeout1 = setTimeout(() => {
        if (mountedRef.current) {
          setTerminationSteps(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'loading' } : i)
          );
        }
      }, index * 400);

      const timeout2 = setTimeout(() => {
        if (mountedRef.current) {
          setTerminationSteps(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i)
          );
        }
      }, index * 400 + 400);

      animationTimeouts.current.push(timeout1, timeout2);
    });

    // After all steps complete, terminate on server
    const timeout3 = setTimeout(async () => {
      if (mountedRef.current) {
        setTerminationCompleted(true);
        setIsTerminating(false);
        
        try {
          await api.terminateSession(sessionId);
          sessionStorage.removeItem(`chatlly_initiator_${sessionId}`);
          sessionStorage.removeItem(`chatlly_code_${sessionId}`);
          wsService.disconnect();
        } catch (err) {
          console.error('Termination failed:', err);
        }
      }
    }, terminationSteps.length * 400 + 800);

    animationTimeouts.current.push(timeout3);
  }, [sessionId, terminationSteps, isTerminating, terminationCompleted, otherUserLeft, showSecondUserTermination, stopTimer]);

  // Second user's termination sequence (UI only, no server call)
  const handleSecondUserTerminateSequence = useCallback(() => {
    if (showSecondUserTermination || terminationCompleted) return;
    
    setShowSecondUserTermination(true);
    
    // Stop timer
    stopTimer();
    
    // Reset steps to pending
    setSecondUserSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    // Animate through each step
    secondUserSteps.forEach((item, index) => {
      const timeout1 = setTimeout(() => {
        if (mountedRef.current) {
          setSecondUserSteps(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'loading' } : i)
          );
        }
      }, index * 400);

      const timeout2 = setTimeout(() => {
        if (mountedRef.current) {
          setSecondUserSteps(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i)
          );
        }
      }, index * 400 + 400);

      animationTimeouts.current.push(timeout1, timeout2);
    });

    // After all steps complete, show destroyed view
    const timeout3 = setTimeout(() => {
      if (mountedRef.current) {
        setTerminationCompleted(true);
        setShowSecondUserTermination(false);
        
        // Clear messages from storage
        sessionStorage.removeItem(`chatlly_messages_${sessionId}`);
        
        // Disconnect WebSocket
        wsService.disconnect();
      }
    }, secondUserSteps.length * 400 + 800);

    animationTimeouts.current.push(timeout3);
  }, [secondUserSteps, sessionId, showSecondUserTermination, terminationCompleted, stopTimer]);

  const handleMessage = useCallback((data: any) => {
    if (!mountedRef.current) return;

    console.log('[ActiveChat] Received message:', data.type);

    if (data.type === 'participant_leaving') {
      // Other user initiated termination - show system message and terminate button
      if (terminationMessageShown.current) return;
      terminationMessageShown.current = true;
      
      setOtherUserLeft(true);
      
      // Add system message
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        text: 'The other participant has ended the chat.',
        sender: 'system',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      return;
    }

    if (data.type === 'time_up') {
      // Other user's timer expired
      handleTimeUpMessage();
      return;
    }

    if (data.type === 'message' && data.data) {
      if (data.id && processedIds.current.has(data.id)) return;
      try {
        // Fix: Properly decode Unicode (emojis)
        const binary = atob(data.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const decoder = new TextDecoder();
        const decoded = decoder.decode(bytes);
        
        processedIds.current.add(data.id);
        setMessages(prev => [...prev, {
          id: data.id,
          text: decoded,
          sender: 'them',
          timestamp: data.timestamp || Date.now(),
          status: 'delivered'
        }]);
        wsService.sendMessage({ type: 'read', messageId: data.id, timestamp: Date.now() });
      } catch (e) { console.error('Failed to decrypt:', e); }
    }

    if (data.type === 'file' && data.file) {
      if (data.id && processedIds.current.has(data.id)) return;
      processedIds.current.add(data.id);
      setMessages(prev => [...prev, {
        id: data.id,
        text: `[File] ${data.file.name}`,
        sender: 'them',
        timestamp: data.timestamp || Date.now(),
        status: 'delivered',
        file: {
          id: data.id,
          name: data.file.name,
          type: data.file.type,
          size: data.file.size,
          data: data.file.data,
          viewOnce: true,
          viewed: false
        }
      }]);
      wsService.sendMessage({ type: 'read', messageId: data.id, timestamp: Date.now() });
    }

    if (data.type === 'typing') {
      setOtherUserTyping(data.isTyping);
      if (data.isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
      }
    }

    if (data.type === 'read' && data.messageId) {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId && msg.sender === 'me'
          ? { ...msg, status: 'read', readAt: data.timestamp }
          : msg
      ));
    }

    if (data.type === 'delivered' && data.messageId) {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId && msg.sender === 'me'
          ? { ...msg, status: 'delivered' }
          : msg
      ));
    }

    if (data.type === 'file_viewed' && data.messageId) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId && msg.file && msg.sender === 'them') {
          return {
            ...msg,
            file: { ...msg.file, viewed: true },
            text: `[File] ${msg.file.name} (viewed)`
          };
        }
        return msg;
      }));
    }
  }, [handleTimeUpMessage]);

  // Register message handler
  useEffect(() => {
    if (!handlerRegistered.current && !isTerminating && !terminationCompleted && !showSecondUserTermination) {
      wsService.addMessageHandler(handleMessage);
      handlerRegistered.current = true;
    }
    return () => {
      if (handlerRegistered.current) {
        wsService.removeMessageHandler(handleMessage);
        handlerRegistered.current = false;
      }
    };
  }, [handleMessage, isTerminating, terminationCompleted, showSecondUserTermination]);

  const handleSend = () => {
    if (!inputText.trim() || !isConnected || isTerminating || otherUserLeft || showSecondUserTermination || timeUp) return;

    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    
    // Fix: Use proper Unicode handling for emojis
    const encoder = new TextEncoder();
    const data = encoder.encode(inputText);
    const encrypted = btoa(String.fromCharCode(...new Uint8Array(data)));
    
    const timestamp = Date.now();

    setMessages(prev => [...prev, {
      id,
      text: inputText,
      sender: 'me',
      timestamp,
      status: 'sent'
    }]);

    setInputText('');

    wsService.sendMessage({ type: 'message', data: encrypted, timestamp, id });
    wsService.sendMessage({ type: 'typing', isTyping: false, timestamp: Date.now() });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isTerminating || otherUserLeft || showSecondUserTermination || timeUp) return;
    setInputText(e.target.value);
    const now = Date.now();
    if (now - lastTypingSent.current > 2000 && e.target.value.length > 0) {
      wsService.sendMessage({ type: 'typing', isTyping: true, timestamp: now });
      lastTypingSent.current = now;
    }
    if (e.target.value.length === 0) {
      wsService.sendMessage({ type: 'typing', isTyping: false, timestamp: now });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    setShowAttachmentMenu(false);
    setIsSendingFile(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];
        const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
        const timestamp = Date.now();

        setMessages(prev => [...prev, {
          id,
          text: `Sending ${file.name}...`,
          sender: 'me',
          timestamp,
          status: 'sending'
        }]);

        wsService.sendMessage({
          type: 'file',
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data,
            viewOnce: true
          },
          timestamp,
          id
        });

        setTimeout(() => {
          if (mountedRef.current) {
            setMessages(prev => prev.map(msg =>
              msg.id === id ? {
                ...msg,
                text: `You sent: ${file.name}`,
                status: 'sent'
              } : msg
            ));
            setIsSendingFile(false);
          }
        }, 200);
      } catch (error) {
        console.error('File send failed:', error);
        alert('Failed to send file. Please try again.');
        setIsSendingFile(false);
      }
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTerminate = () => {
    if (!isTerminating && !otherUserLeft && !showSecondUserTermination) {
      setShowTerminateModal(true);
    }
  };

  const confirmTerminate = () => {
    handleInitiatorTerminateSequence();
  };

  const handleFileViewed = (fileId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.file?.id === fileId && msg.sender === 'them') {
        return { ...msg, file: { ...msg.file, viewed: true } };
      }
      return msg;
    }));
    wsService.sendMessage({ type: 'file_viewed', messageId: fileId, timestamp: Date.now() });
  };

  const handleClose = () => onTerminate();
  const handleNewChat = () => onCreateNew ? onCreateNew() : onTerminate();

  // Show termination views
  if (isTerminating) return <DestroyingSessionView steps={terminationSteps} />;
  if (showSecondUserTermination) return <DestroyingSessionView steps={secondUserSteps} />;
  if (terminationCompleted) return <SessionDestroyedView onNewChat={handleNewChat} onClose={handleClose} />;

  // Fixed heights
  const headerHeight = 57;
  const connectionStatusHeight = !isConnected && !otherUserLeft && !timeUp ? 41 : 0;
  const inputHeight = (otherUserLeft || timeUp) ? 73 : 73;
  const messageBottom = inputHeight;

  return (
    <div className="fixed inset-0 bg-navy">
      {/* Fixed Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerHeight, zIndex: 50 }}>
        <ChatHeader
          isConnected={isConnected}
          timeLeft={timeLeft}
          formatTime={formatTime}
          onTerminate={handleTerminate}
          onExtend={() => {}} // No extend functionality
          isTerminated={otherUserLeft || timeUp}
        />
      </div>

      {/* Connection status */}
      {!isConnected && !otherUserLeft && !timeUp && (
        <div style={{ 
          position: 'absolute', 
          top: headerHeight, 
          left: 0, 
          right: 0, 
          height: connectionStatusHeight,
          zIndex: 40,
          backgroundColor: 'rgba(250, 204, 21, 0.1)',
          borderBottom: '1px solid rgba(250, 204, 21, 0.2)',
          padding: '0.5rem 1rem'
        }}>
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-yellow-400 text-xs">Establishing secure connection...</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        style={{
          position: 'absolute',
          top: headerHeight + connectionStatusHeight,
          bottom: messageBottom,
          left: 0,
          right: 0,
          overflowY: 'auto',
          padding: '1rem',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-3">
          {messages.map((m) => {
            if (m.sender === 'system') {
              // System message (not a bubble)
              return (
                <div key={m.id} className="flex justify-center">
                  <div className="bg-white/5 px-4 py-2 rounded-full">
                    <p className="text-xs text-grey">{m.text}</p>
                  </div>
                </div>
              );
            }
            // Regular message bubble
            return (
              <MessageBubble key={m.id} message={m} onViewFile={(msg) => setPreviewFile(msg.file!)} />
            );
          })}
          {otherUserTyping && !otherUserLeft && !timeUp && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input or Terminate Button */}
      {!otherUserLeft && !timeUp ? (
        <div 
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: keyboardHeight,
            height: inputHeight,
            zIndex: 40,
            backgroundColor: '#0A192F',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                disabled={!isConnected || isSendingFile}
                className="p-2 text-grey hover:text-white disabled:opacity-50"
              >
                <FaPaperclip className="w-5 h-5" />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleTyping}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isConnected ? "Type your message..." : "Connecting..."}
                disabled={!isConnected || isSendingFile}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-grey/50 focus:outline-none focus:border-sky/50 disabled:opacity-50"
              />
              
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() || !isConnected || isSendingFile}
                className="p-2 bg-sky text-navy rounded-xl hover:bg-sky-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 73,
            zIndex: 40,
            backgroundColor: '#0A192F',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="max-w-4xl mx-auto px-4 w-full">
            <button
              onClick={handleSecondUserTerminateSequence}
              className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors text-sm font-medium border border-red-500/20 hover:border-red-500/50 flex items-center justify-center gap-2"
            >
              <FaTrash className="w-4 h-4" />
              <span>Terminate session</span>
            </button>
          </div>
        </div>
      )}

      {showAttachmentMenu && !otherUserLeft && !timeUp && (
        <AttachmentMenu
          onSelectImage={() => imageInputRef.current?.click()}
          onSelectPDF={() => { if (docInputRef.current) { docInputRef.current.accept = '.pdf'; docInputRef.current.click(); } }}
          onSelectWord={() => { if (docInputRef.current) { docInputRef.current.accept = '.doc,.docx'; docInputRef.current.click(); } }}
          onClose={() => setShowAttachmentMenu(false)}
        />
      )}

      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />

      <TerminationModal
        show={showTerminateModal}
        isTerminating={isTerminating}
        steps={terminationSteps}
        onConfirm={confirmTerminate}
        onCancel={() => setShowTerminateModal(false)}
      />

      {previewFile && (
        <FileViewer file={previewFile} onClose={() => setPreviewFile(null)} onViewed={handleFileViewed} />
      )}
    </div>
  );
};

export default ActiveChat;
