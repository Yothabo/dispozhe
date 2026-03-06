import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import useKeyboard from '../../hooks/useKeyboard';
import wsService from '../../services/websocket';
import { preventRefresh, disableRefreshKeys, setTerminatingState } from '../../utils/preventRefresh';
import { notifyManagement } from '../NotificationCenter';
import { useChatMessages, useChatTermination, useChatBackNavigation, useFileHandling, useChatTyping } from './hooks';
import { useChatTimer } from './hooks/useChatTimer';
import { useChatMessageHandlers } from './hooks/useChatMessageHandlers';
import { useWebSocketConnection } from './hooks/useWebSocketConnection';
import { useSessionPolling } from './hooks/useSessionPolling';
import { useMessageHandler } from './hooks/useMessageHandler';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';
import { useSessionValidation } from '../../hooks/useSessionValidation';

import ChatHeader from './header/ChatHeader';
import AttachmentMenu from './file/AttachmentMenu';
import FileViewer from './file/FileViewer';
import MessageContainer from './messages/MessageContainer';
import TerminationActions from './termination/TerminationActions';
import TerminationModal from './termination/TerminationModal';
import DestroyingSessionView from './termination/views/DestroyingSessionView';
import SessionDestroyedView from './termination/views/SessionDestroyedView';

interface ActiveChatProps {
  sessionId: string;
  duration: number;
  _encryptionKey?: string;
  onTerminate: () => void;
}

const ActiveChat: React.FC<ActiveChatProps> = ({
  sessionId,
  duration,
  onTerminate
}) => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [_isTerminatingProcess, setIsTerminatingProcess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const connectionId = useRef<string>(`conn-${Date.now()}-${Math.random()}`);
  const sessionEnded = useRef<boolean>(false);

  const keyboardHeight = useKeyboard();

  const { checking: sessionChecking } = useSessionValidation({
    sessionId,
    redirectTo: '/'
  });

  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    processedIds,
    viewedFiles
  } = useChatMessages(sessionId);

  const {
    otherUserTyping,
    typingTimeoutRef,
    sendTyping,
    handleTyping,
    handleTypingIndicator
  } = useChatTyping();

  const {
    timeLeft,
    formatTime,
    timeUp,
    stopTimer
  } = useChatTimer({
    sessionId,
    initialDuration: duration,
    isConnected,
    onTimeUp: () => {
      if (sessionEnded.current) return;
      sessionEnded.current = true;
      
      addMessage({
        id: `system-timeup-${Date.now()}`,
        text: 'Session time has expired',
        sender: 'system',
        timestamp: Date.now()
      });
      
      // Disconnect WebSocket
      wsService.disconnect();
    }
  });

  const {
    showTerminateModal,
    setShowTerminateModal,
    isTerminating,
    terminationCompleted,
    otherUserLeft,
    setOtherUserLeft,
    showSecondUserTermination,
    secondUserSteps,
    terminationSteps,
    handleInitiatorTerminate,
    handleSecondUserTerminate,
  } = useChatTermination(sessionId, onTerminate, stopTimer);

  const {
    previewFile,
    setPreviewFile,
    handleFileSelect,
    handleViewFile,
    handleFileViewed,
    isSendingFile: isUploading
  } = useFileHandling(
    addMessage,
    setMessages,
    viewedFiles,
    mountedRef,
    setIsSendingFile,
    () => setShowAttachmentMenu(false)
  );

  useChatBackNavigation(setShowTerminateModal, terminationCompleted);

  useNavigationGuard({
    isActive: !terminationCompleted && !showSecondUserTermination && !isTerminating,
    onBack: () => {
      if (!isTerminating && !otherUserLeft && !showSecondUserTermination) {
        handleInitiatorTerminate();
      }
    }
  });

  const { handleMessage } = useChatMessageHandlers(
    addMessage,
    updateMessage,
    setMessages,
    processedIds,
    viewedFiles,
    setOtherUserLeft,
    () => {},
    handleTypingIndicator
  );

  useWebSocketConnection({
    sessionId,
    isTerminating,
    terminationCompleted,
    showSecondUserTermination,
    onConnected: setIsConnected,
    connectionId
  });

  useSessionPolling({
    sessionId,
    terminationCompleted,
    showSecondUserTermination,
    onStatusUpdate: () => {},
    onSessionEnded: () => {
      // Session ended on server, stop everything
      sessionEnded.current = true;
      stopTimer();
      wsService.disconnect();
    },
    connectionId
  });

  useMessageHandler({
    isTerminating,
    terminationCompleted,
    showSecondUserTermination,
    onMessage: handleMessage as (message: Record<string, unknown>) => void,
    connectionId
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const connected = wsService.isConnected();
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

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
    const currentTypingTimeout = typingTimeoutRef.current;
    return () => {
      mountedRef.current = false;
      if (currentTypingTimeout) {
        clearTimeout(currentTypingTimeout);
      }
    };
  }, [typingTimeoutRef]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Handle server-driven time up
  useEffect(() => {
    if (timeUp && !sessionEnded.current) {
      sessionEnded.current = true;
      wsService.disconnect();
    }
  }, [timeUp]);

  if (sessionChecking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey text-sm font-light">Validating session...</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!inputText.trim() || !isConnected || isTerminating || otherUserLeft || showSecondUserTermination || timeUp || sessionEnded.current) return;

    const id = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(inputText);
    const encrypted = btoa(String.fromCharCode(...new Uint8Array(data)));
    const timestamp = Date.now();

    addMessage({
      id,
      text: inputText,
      sender: 'me',
      timestamp,
      status: 'sent'
    });

    setInputText('');
    wsService.sendMessage({ type: 'message', data: encrypted, timestamp, id });
    sendTyping(false);
  };

  const handleTypingWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (sessionEnded.current) return;
    handleTyping(
      e,
      isTerminating,
      otherUserLeft,
      showSecondUserTermination,
      timeUp,
      setInputText
    );
  };

  const handleTerminate = () => {
    if (!isTerminating && !otherUserLeft && !showSecondUserTermination) {
      setShowTerminateModal(true);
    }
  };

  const confirmTerminate = () => {
    setIsTerminatingProcess(true);
    wsService.setTerminating();
    setTerminatingState(true);
    sessionEnded.current = true;
    setTimeout(() => {
      handleInitiatorTerminate();
    }, 50);
  };

  const handleNewChat = () => {
    navigate('/create');
  };

  const handleClose = () => {
    navigate('/');
  };

  const handleDummyFileSelect = () => {
    notifyManagement('This file type is not yet supported', 'info');
  };

  if (isTerminating) return <DestroyingSessionView steps={terminationSteps} />;
  if (showSecondUserTermination) return <DestroyingSessionView steps={secondUserSteps} />;
  if (terminationCompleted) return (
    <SessionDestroyedView
      _onNewChat={handleNewChat}
      _onClose={handleClose}
    />
  );

  return (
    <div className="fixed inset-0 bg-navy flex flex-col">
      <div className="h-[57px] flex-shrink-0">
        <ChatHeader
          isConnected={isConnected}
          timeLeft={timeLeft}
          formatTime={formatTime}
          onTerminate={handleTerminate}
          onExtend={() => {}}
          isTerminated={otherUserLeft || timeUp || sessionEnded.current}
        />
      </div>

      {!isConnected && !otherUserLeft && !timeUp && !sessionEnded.current && (
        <div className="h-[41px] flex-shrink-0 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center justify-center">
          <p className="text-yellow-400 text-xs">Establishing secure connection...</p>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4"
      >
        <div className="max-w-4xl mx-auto py-4">
          <MessageContainer
            messages={messages}
            otherUserTyping={otherUserTyping}
            otherUserLeft={otherUserLeft}
            timeUp={timeUp || sessionEnded.current}
            onViewFile={handleViewFile}
            messagesEndRef={messagesEndRef}
          />
        </div>
      </div>

      {!otherUserLeft && !timeUp && !sessionEnded.current ? (
        <div
          className="bg-navy border-t border-white/10 flex-shrink-0"
          style={{ paddingBottom: keyboardHeight }}
        >
          <div className="max-w-4xl mx-auto px-4 h-[73px] flex items-center gap-2">
            <button
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              disabled={!isConnected || isSendingFile || isUploading}
              className="p-3 text-grey hover:text-white disabled:opacity-50 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 hover:border-sky/30"
              title="Attach file"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
              </svg>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleTypingWrapper}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              disabled={!isConnected || isSendingFile || isUploading}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-grey/50 focus:outline-none focus:border-sky/50 disabled:opacity-50 text-base"
            />

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || !isConnected || isSendingFile || isUploading}
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
        <div className="h-[73px] bg-navy border-t border-white/10 flex items-center justify-center flex-shrink-0">
          <TerminationActions onTerminate={handleSecondUserTerminate} />
        </div>
      )}

      <AttachmentMenu
        isOpen={showAttachmentMenu}
        onSelectImage={() => imageInputRef.current?.click()}
        onSelectPDF={handleDummyFileSelect}
        onSelectWord={handleDummyFileSelect}
        onSelectExcel={handleDummyFileSelect}
        onSelectPowerpoint={handleDummyFileSelect}
        onSelectArchive={handleDummyFileSelect}
        onSelectAudio={handleDummyFileSelect}
        onSelectVideo={handleDummyFileSelect}
        onSelectCode={handleDummyFileSelect}
        onClose={() => setShowAttachmentMenu(false)}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <TerminationModal
        show={showTerminateModal}
        isTerminating={isTerminating}
        steps={terminationSteps}
        onConfirm={confirmTerminate}
        onCancel={() => setShowTerminateModal(false)}
      />

      {previewFile && (
        <FileViewer
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onViewed={handleFileViewed}
        />
      )}
    </div>
  );
};

export default ActiveChat;
