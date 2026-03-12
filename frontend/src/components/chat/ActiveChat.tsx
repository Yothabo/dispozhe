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
import MessageArea from './sections/MessageArea';
import ChatInputSection from './sections/ChatInputSection';
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const connectionAttempted = useRef(false);
  const lastExtendedMinutes = useRef<number | null>(null);
  const isAtBottom = useRef(true);

  const { messages, otherUserTyping, setOtherUserTyping, addMessage, updateMessageStatus } = useChatMessages(sessionId);
  const { sendEncrypted, isReady } = useEncryption();

  // Track if user is near bottom
  const handleMessagesScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      isAtBottom.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (isAtBottom.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  // Simple keyboard detection - only update input position
  useEffect(() => {
    const updateKeyboardHeight = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
      } else {
        const heightDiff = document.documentElement.clientHeight - window.innerHeight;
        setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardHeight);
    }
    window.addEventListener('resize', updateKeyboardHeight);

    updateKeyboardHeight();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateKeyboardHeight);
      }
      window.removeEventListener('resize', updateKeyboardHeight);
    };
  }, []);

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
        // Silently fail
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
      
      // Scroll after send
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
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
        setTerminationSteps((prev: TerminationStep[]) =>
          prev.map((i: TerminationStep) => i.id === item.id ? { ...i, status: 'loading' } : i)
        );
      }, index * 400);
      setTimeout(() => {
        setTerminationSteps((prev: TerminationStep[]) =>
          prev.map((i: TerminationStep) => i.id === item.id ? { ...i, status: 'completed' } : i)
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
        setSecondUserSteps((prev: TerminationStep[]) =>
          prev.map((i: TerminationStep) => i.id === item.id ? { ...i, status: 'loading' } : i)
        );
      }, index * 400);
      setTimeout(() => {
        setSecondUserSteps((prev: TerminationStep[]) =>
          prev.map((i: TerminationStep) => i.id === item.id ? { ...i, status: 'completed' } : i)
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

  // Add scroll listener
  useEffect(() => {
    const currentContainer = messagesContainerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('scroll', handleMessagesScroll);
      return () => currentContainer.removeEventListener('scroll', handleMessagesScroll);
    }
  }, [handleMessagesScroll]);

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
      {/* Header – fixed at top */}
      <div className="flex-shrink-0 z-10">
        <ChatHeader
          isConnected={isConnected}
          timeLeft={timeLeft}
          formatTime={formatTime}
          onTerminate={() => setShowTerminateModal(true)}
          onExtend={handleExtend}
          isTerminated={otherUserLeft || timeUp || sessionEnded.current}
        />
      </div>

      {/* Messages area – fills space, no extra padding */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4"
        onScroll={handleMessagesScroll}
      >
        <MessageArea
          messages={messages}
          otherUserTyping={otherUserTyping}
          otherUserLeft={otherUserLeft}
          timeUp={timeUp}
          sessionEnded={sessionEnded.current}
          onViewFile={() => {}}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Input section – only this moves with keyboard */}
      {!otherUserLeft && !timeUp && !sessionEnded.current ? (
        <div
          className="fixed left-0 right-0 bg-navy border-t border-white/10"
          style={{
            bottom: keyboardHeight,
          }}
        >
          <ChatInputSection
            inputText={inputText}
            isConnected={isConnected}
            encryptionReady={isReady}
            isSendingFile={false}
            isUploading={false}
            onInputChange={handleTyping}
            onSend={handleSend}
            onAttachmentClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            inputRef={inputRef}
          />
        </div>
      ) : (
        <div className="fixed left-0 right-0 bottom-0 bg-navy border-t border-white/10 px-4 py-3">
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
        if (handlerRef.current) handlerRef.current(id, text, timestamp);
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
