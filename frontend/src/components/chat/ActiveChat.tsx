import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import wsService, { WebSocketMessage } from '../../services/websocket';
import api from '../../services/api';
import { useChatMessages } from './hooks/useChatMessages';
import { useMessageHandler } from './hooks/useMessageHandler';
import { preventRefresh, disableRefreshKeys, setTerminatingState } from '../../utils/preventRefresh';
import { notifyManagement } from '../NotificationCenter';
import { EncryptionProvider, useEncryption } from '../../contexts/WebSocketContext';
import ChatHeader from './header/ChatHeader';
import MessageContainer from './messages/MessageContainer';
import AttachmentMenu from './file/AttachmentMenu';
import FileViewer from './file/FileViewer';
import TerminationActions from './termination/TerminationActions';
import TerminationModal from './termination/TerminationModal';
import DestroyingSessionView from './termination/views/DestroyingSessionView';
import SessionDestroyedView from './termination/views/SessionDestroyedView';
import { FileMessage } from './types';

type TerminationStep = {
  id: number;
  label: string;
  status: 'pending' | 'loading' | 'completed';
};

interface ActiveChatProps {
  sessionId: string;
  duration: number;
  encryptionKey?: string;
  onTerminate: () => void;
}

interface ActiveChatContentProps extends ActiveChatProps {
  onDecryptedHandlerRegister: (handler: (id: string, text: string, timestamp: number) => void) => void;
}

const ActiveChatContent: React.FC<ActiveChatContentProps> = ({
  sessionId,
  duration,
  onTerminate: _onTerminate,
  onDecryptedHandlerRegister
}) => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [terminationCompleted, setTerminationCompleted] = useState(false);
  const [showSecondUserTermination, setShowSecondUserTermination] = useState(false);
  const [otherUserLeft, setOtherUserLeft] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileMessage | null>(null);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [timeUp, setTimeUp] = useState(false);
  const [terminationSteps, setTerminationSteps] = useState<TerminationStep[]>([
    { id: 1, label: 'Destroy session link', status: 'pending' },
    { id: 2, label: 'Wipe encryption keys from memory', status: 'pending' },
    { id: 3, label: 'Clear session data from server', status: 'pending' },
    { id: 4, label: 'Close encrypted tunnel', status: 'pending' },
    { id: 5, label: 'Purge all traces from database', status: 'pending' }
  ]);

  const [secondUserSteps, setSecondUserSteps] = useState<TerminationStep[]>([
    { id: 1, label: 'Session terminated by other user', status: 'pending' },
    { id: 2, label: 'Encryption keys destroyed', status: 'pending' },
    { id: 3, label: 'Session data cleared from server', status: 'pending' },
    { id: 4, label: 'Encrypted tunnel closed', status: 'pending' },
    { id: 5, label: 'All traces purged', status: 'pending' }
  ]);

  const sessionEnded = useRef(false);
  const mountedRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const connectionAttempted = useRef(false);
  const lastExtendedMinutes = useRef<number | null>(null);

  const { messages, otherUserTyping, setOtherUserTyping, addMessage, updateMessageStatus } = useChatMessages(sessionId);
  const { sendEncrypted, isReady } = useEncryption();

  const handleExtend = useCallback(async (minutes: number) => {
    try {
      await api.extendSession(sessionId, minutes);
      setTimeLeft(prev => prev + (minutes * 60));
      lastExtendedMinutes.current = minutes;
      notifyManagement(`Session extended by ${minutes} minutes`, 'success');
    } catch {
      notifyManagement('Failed to extend session', 'error');
    }
  }, [sessionId]);

  useEffect(() => {
    const handleTimeUpdate = (message: WebSocketMessage) => {
      if (message.type === 'time_update' && typeof message.time_left === 'number') {
        const oldTime = timeLeft;
        const newTime = message.time_left;
        setTimeLeft(newTime);
        const timeAdded = newTime - oldTime;
        if (timeAdded > 0 && timeAdded < 3600) {
          const minutesAdded = Math.round(timeAdded / 60);
          addMessage({
            id: `system-extend-${Date.now()}`,
            text: `${minutesAdded} minute${minutesAdded > 1 ? 's' : ''} added to session`,
            sender: 'system',
            timestamp: Date.now(),
            status: 'delivered'
          });
        }
      }
    };

    wsService.addMessageHandler(handleTimeUpdate);
    return () => wsService.removeMessageHandler(handleTimeUpdate);
  }, [timeLeft, addMessage]);

  useEffect(() => {
    const handleDecrypted = (id: string, text: string, timestamp: number) => {
      addMessage({
        id,
        text,
        sender: 'them',
        timestamp,
        status: 'delivered'
      });
      wsService.sendMessage({
        type: 'read',
        messageId: id,
        timestamp: Date.now()
      });
    };
    onDecryptedHandlerRegister(handleDecrypted);
  }, [onDecryptedHandlerRegister, addMessage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeUp(true);
          sessionEnded.current = true;
          addMessage({
            id: `system-timeup-${Date.now()}`,
            text: 'Session time has expired',
            sender: 'system',
            timestamp: Date.now(),
            status: 'delivered'
          });
          wsService.disconnect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [addMessage]);

  useEffect(() => {
    if (connectionAttempted.current) return;
    connectionAttempted.current = true;

    const connect = async () => {
      try {
        await wsService.connect(sessionId);
        if (mountedRef.current) {
          setIsConnected(true);
          reconnectAttempts.current = 0;
        }
      } catch {
        // Silently fail - will show connection status in UI
      }
    };
    connect();
  }, [sessionId]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'connected') {
      setIsConnected(true);
    } else if (message.type === 'both_connected') {
      notifyManagement('Other participant joined', 'success');
    } else if (message.type === 'participant_left') {
      setOtherUserLeft(true);
      setShowSecondUserTermination(true);
      addMessage({
        id: `system-${Date.now()}`,
        text: 'The other participant has left the chat.',
        sender: 'system',
        timestamp: Date.now(),
        status: 'delivered'
      });
      notifyManagement('Other participant left the chat', 'warning');
    } else if (message.type === 'delivery_status' && message.message_id) {
      updateMessageStatus(message.message_id as string, 'delivered');
    } else if (message.type === 'read' && message.messageId) {
      updateMessageStatus(message.messageId as string, 'read');
    } else if (message.type === 'typing') {
      setOtherUserTyping(message.isTyping as boolean);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (message.isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 3000);
      }
    } else if (message.type === 'session_terminated') {
      sessionEnded.current = true;
      wsService.disconnect();
      setTerminationCompleted(true);
    }
  }, [addMessage, updateMessageStatus, setOtherUserTyping]);

  useMessageHandler({ onMessage: handleMessage });

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !isConnected || otherUserLeft || timeUp || sessionEnded.current || !isReady) {
      return;
    }
    const id = crypto.randomUUID();
    const encrypted = await sendEncrypted(inputText);
    if (encrypted) {
      const message = {
        type: 'message',
        id,
        data: encrypted.encrypted,
        keyId: encrypted.keyId,
        timestamp: Date.now()
      };
      addMessage({
        id,
        text: inputText,
        sender: 'me',
        timestamp: Date.now(),
        status: 'sent'
      });
      wsService.sendMessage(message);
      setInputText('');
    }
  }, [inputText, isConnected, otherUserLeft, timeUp, sessionEnded, isReady, sendEncrypted, addMessage]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!otherUserLeft && !timeUp && !sessionEnded.current && isConnected) {
      wsService.sendMessage({
        type: 'typing',
        isTyping: true,
        timestamp: Date.now()
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        wsService.sendMessage({
          type: 'typing',
          isTyping: false,
          timestamp: Date.now()
        });
      }, 1000);
    }
  }, [otherUserLeft, timeUp, sessionEnded, isConnected]);

  const handleTerminate = useCallback(async () => {
    setIsTerminating(true);
    setShowTerminateModal(false);
    terminationSteps.forEach((item, index) => {
      setTimeout(() => {
        setTerminationSteps(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'loading' } : i)
        );
      }, index * 400);
      setTimeout(() => {
        setTerminationSteps(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i)
        );
      }, index * 400 + 400);
    });
    try {
      await api.terminateSession(sessionId);
      wsService.sendMessage({ type: 'participant_leaving', timestamp: Date.now() });
      wsService.disconnect();
      wsService.setTerminating();
      setTerminatingState(true);
      sessionEnded.current = true;
      setTimeout(() => {
        if (mountedRef.current) {
          setTerminationCompleted(true);
          setIsTerminating(false);
          notifyManagement('Session terminated successfully', 'success');
        }
      }, terminationSteps.length * 400 + 800);
    } catch {
      setIsTerminating(false);
    }
  }, [sessionId, terminationSteps]);

  const handleSecondUserTerminate = useCallback(() => {
    setShowSecondUserTermination(true);
    secondUserSteps.forEach((item, index) => {
      setTimeout(() => {
        setSecondUserSteps(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'loading' } : i)
        );
      }, index * 400);
      setTimeout(() => {
        setSecondUserSteps(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i)
        );
      }, index * 400 + 400);
    });
    wsService.disconnect();
    setTimeout(() => {
      if (mountedRef.current) {
        setTerminationCompleted(true);
        setShowSecondUserTermination(false);
        sessionStorage.removeItem(`Driflly_messages_${sessionId}`);
      }
    }, secondUserSteps.length * 400 + 800);
  }, [secondUserSteps, sessionId]);

  useEffect(() => {
    if (!terminationCompleted && !showSecondUserTermination && !isTerminating) {
      const cleanupRefresh = preventRefresh();
      const cleanupKeys = disableRefreshKeys();
      return () => {
        cleanupRefresh();
        cleanupKeys();
      };
    }
  }, [terminationCompleted, showSecondUserTermination, isTerminating]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 || isTerminating || terminationCompleted || otherUserLeft || showSecondUserTermination) {
      return;
    }
    const timeout = setTimeout(() => {
      sessionStorage.setItem(`Driflly_messages_${sessionId}`, JSON.stringify(messages));
    }, 500);
    return () => clearTimeout(timeout);
  }, [messages, sessionId, isTerminating, terminationCompleted, otherUserLeft, showSecondUserTermination]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isConnected && !terminationCompleted && !isTerminating && !showSecondUserTermination) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey text-sm font-light">Connecting to secure chat...</p>
        </div>
      </div>
    );
  }

  if (isTerminating) return <DestroyingSessionView steps={terminationSteps} />;
  if (showSecondUserTermination) return <DestroyingSessionView steps={secondUserSteps} />;
  if (terminationCompleted) {
    return (
      <SessionDestroyedView
        onNewChat={() => navigate('/create')}
        onClose={() => navigate('/')}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-navy flex flex-col">
      <ChatHeader
        isConnected={isConnected}
        timeLeft={timeLeft}
        formatTime={formatTime}
        onTerminate={() => setShowTerminateModal(true)}
        onExtend={handleExtend}
        isTerminated={otherUserLeft || timeUp || sessionEnded.current}
      />
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-4xl mx-auto py-4">
          <MessageContainer
            messages={messages}
            otherUserTyping={otherUserTyping}
            otherUserLeft={otherUserLeft}
            timeUp={timeUp || sessionEnded.current}
            onViewFile={() => {}}
            messagesEndRef={messagesEndRef}
          />
        </div>
      </div>
      {!otherUserLeft && !timeUp && !sessionEnded.current ? (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="max-w-4xl mx-auto flex gap-2">
            <button
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              disabled={!isConnected}
              className="p-3 text-grey hover:text-white disabled:opacity-50 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 hover:border-sky/30"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
              </svg>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleTyping}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              disabled={!isConnected || otherUserLeft || timeUp || sessionEnded.current}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-grey/50 focus:outline-none focus:border-sky/50 disabled:opacity-50 text-base"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || !isConnected || otherUserLeft || timeUp || sessionEnded.current}
              className="p-3 bg-sky text-navy rounded-xl hover:bg-sky-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/10 px-4 py-3">
          <TerminationActions onTerminate={handleSecondUserTerminate} />
        </div>
      )}
      <AttachmentMenu
        isOpen={showAttachmentMenu}
        onSelectImage={() => imageInputRef.current?.click()}
        onSelectPDF={() => notifyManagement('This file type is not yet supported', 'info')}
        onSelectWord={() => notifyManagement('This file type is not yet supported', 'info')}
        onSelectExcel={() => notifyManagement('This file type is not yet supported', 'info')}
        onSelectPowerpoint={() => notifyManagement('This file type is not yet supported', 'info')}
        onSelectArchive={() => notifyManagement('This file type is not yet supported', 'info')}
        onSelectAudio={() => notifyManagement('This file type is not yet supported', 'info')}
        onSelectVideo={() => notifyManagement('This file type is not yet supported', 'info')}
        onSelectCode={() => notifyManagement('This file type is not yet supported', 'info')}
        onClose={() => setShowAttachmentMenu(false)}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={() => {}}
        className="hidden"
      />
      <TerminationModal
        show={showTerminateModal}
        isTerminating={isTerminating}
        steps={terminationSteps}
        onConfirm={handleTerminate}
        onCancel={() => setShowTerminateModal(false)}
      />
      {previewFile && (
        <FileViewer
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onViewed={() => {}}
        />
      )}
    </div>
  );
};

const ActiveChat: React.FC<ActiveChatProps> = (props) => {
  const handlerRef = useRef<((id: string, text: string, timestamp: number) => void) | undefined>();
  const registerHandler = useCallback((h: (id: string, text: string, timestamp: number) => void) => {
    handlerRef.current = h;
  }, []);

  return (
    <EncryptionProvider
      sessionId={props.sessionId}
      encryptionKey={props.encryptionKey}
      onMessageDecrypted={(id, text, timestamp) => {
        if (handlerRef.current) {
          handlerRef.current(id, text, timestamp);
        }
      }}
    >
      <ActiveChatContent
        {...props}
        onDecryptedHandlerRegister={registerHandler}
      />
    </EncryptionProvider>
  );
};

export default ActiveChat;
