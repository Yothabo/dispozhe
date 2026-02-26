import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks
import useKeyboard from '../../hooks/useKeyboard';
import wsService from '../../services/websocket';
import { preventRefresh, disableRefreshKeys } from '../../utils/preventRefresh';
import { notifyManagement } from '../NotificationCenter';

import ConnectionBanner from './connection/ConnectionBanner';
import AttachmentMenu from './file/AttachmentMenu';
import FileViewer from './file/FileViewer';
import ChatHeader from './header/ChatHeader';
import {
  useChatMessages,
  useChatTermination,
  useChatBackNavigation,
  useFileHandling,
  useChatTimer,
  useChatTyping
} from './hooks';
import { useChatMessageHandlers } from './hooks/useChatMessageHandlers';

// Components
import ChatInputControls from './input/ChatInputControls';
import MessageContainer from './messages/MessageContainer';
import TerminationActions from './termination/TerminationActions';
import TerminationModal from './termination/TerminationModal';
import DestroyingSessionView from './termination/views/DestroyingSessionView';
import SessionDestroyedView from './termination/views/SessionDestroyedView';

// Types
import { Message } from './types';

interface ActiveChatProps {
  sessionId: string;
  duration: number;
  encryptionKey: string;
  onTerminate: () => void;
}

const ActiveChat: React.FC<ActiveChatProps> = ({
  sessionId,
  duration,
  encryptionKey,
  onTerminate
}) => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [sessionActive, setSessionActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const animationTimeouts = useRef<NodeJS.Timeout[]>([]);
  const handlerRegistered = useRef<boolean>(false);
  const connectionEstablished = useRef<boolean>(false);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const statusPollInterval = useRef<NodeJS.Timeout | null>(null);
  const connectionId = useRef<string>(`conn-${Date.now()}-${Math.random()}`);

  const keyboardHeight = useKeyboard();

  // Custom hooks
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
    setTimeUp,
    stopTimer,
    handleTimeUpMessage
  } = useChatTimer(duration, isConnected, addMessage, wsService);

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
    handleParticipantLeaving
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

  // Message handlers
  const { handleMessage } = useChatMessageHandlers(
    addMessage,
    updateMessage,
    setMessages,
    processedIds,
    viewedFiles,
    setOtherUserLeft,
    handleTimeUpMessage,
    handleTypingIndicator
  );

  // Poll session status to detect when second user joins
  useEffect(() => {
    if (!sessionId || terminationCompleted || showSecondUserTermination) return;

    console.log(`[${connectionId.current}] Starting status polling`);

    const pollStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/session/${sessionId}/status`);
        const data = await response.json();
        
        setParticipantCount(data.participant_count);
        setSessionActive(data.status === 'active');
        
        if (data.status === 'active' && data.participant_count === 2) {
          console.log(`[${connectionId.current}] 🎉 Second user joined!`);
        }
        
        if (data.status === 'expired' || data.status === 'terminated') {
          console.log(`[${connectionId.current}] Session ended:`, data.status);
          handleTimeUpMessage();
        }
      } catch (err) {
        console.error(`[${connectionId.current}] Status poll failed:`, err);
      }
    };

    pollStatus();
    statusPollInterval.current = setInterval(pollStatus, 2000);

    return () => {
      if (statusPollInterval.current) {
        clearInterval(statusPollInterval.current);
        statusPollInterval.current = null;
      }
    };
  }, [sessionId, terminationCompleted, showSecondUserTermination, handleTimeUpMessage]);

  // Single connection attempt - this runs ONCE per component lifecycle
  useEffect(() => {
    // Prevent multiple connection attempts
    if (connectionEstablished.current || isTerminating || terminationCompleted || showSecondUserTermination) {
      console.log(`[${connectionId.current}] Connection already established or component terminating`);
      return;
    }

    console.log(`[${connectionId.current}] 🔌 Connecting to session:`, sessionId);
    connectionEstablished.current = true;

    const connect = async () => {
      try {
        await wsService.connect(sessionId);
        if (mountedRef.current) {
          setIsConnected(true);
          console.log(`[${connectionId.current}] ✅ WebSocket connected successfully`);
        }
      } catch (err) {
        console.error(`[${connectionId.current}] ❌ WebSocket connection failed:`, err);
        connectionEstablished.current = false;
        
        // Retry after delay
        if (mountedRef.current && !reconnectTimer.current) {
          console.log(`[${connectionId.current}] Scheduling reconnect...`);
          reconnectTimer.current = setTimeout(() => {
            console.log(`[${connectionId.current}] Reconnecting...`);
            reconnectTimer.current = null;
            connectionEstablished.current = false;
            // The useEffect will run again because connectionEstablished is false
          }, 3000);
        }
      }
    };

    connect();

    return () => {
      console.log(`[${connectionId.current}] 🧹 Cleanup - DO NOT disconnect WebSocket here`);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      // DO NOT disconnect here - let the service handle it
    };
  }, [sessionId, isTerminating, terminationCompleted, showSecondUserTermination]);

  // Register message handler once
  useEffect(() => {
    if (!handlerRegistered.current && !isTerminating && !terminationCompleted && !showSecondUserTermination) {
      console.log(`[${connectionId.current}] Adding message handler`);
      wsService.addMessageHandler(handleMessage);
      handlerRegistered.current = true;
    }
    return () => {
      if (handlerRegistered.current) {
        console.log(`[${connectionId.current}] Removing message handler`);
        wsService.removeMessageHandler(handleMessage);
        handlerRegistered.current = false;
      }
    };
  }, [handleMessage, isTerminating, terminationCompleted, showSecondUserTermination]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = wsService.isConnected();
      if (connected !== isConnected) {
        console.log(`[${connectionId.current}] Connection status changed:`, connected);
        setIsConnected(connected);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Prevent refresh during active chat
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

  // Save messages to sessionStorage (debounced)
  useEffect(() => {
    if (messages.length === 0 || isTerminating || terminationCompleted || otherUserLeft || showSecondUserTermination) {
      return;
    }

    const timeout = setTimeout(() => {
      sessionStorage.setItem(`Driflly_messages_${sessionId}`, JSON.stringify(messages));
    }, 500);

    return () => clearTimeout(timeout);
  }, [messages, sessionId, isTerminating, terminationCompleted, otherUserLeft, showSecondUserTermination]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      console.log(`[${connectionId.current}] 💥 Component unmounting`);
      mountedRef.current = false;
      animationTimeouts.current.forEach(clearTimeout);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [typingTimeoutRef]);

  // Scroll to bottom (debounced)
  useEffect(() => {
    if (!messagesEndRef.current) return;

    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);

    return () => clearTimeout(timeout);
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !isConnected || isTerminating || otherUserLeft || showSecondUserTermination || timeUp) return;

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
    handleInitiatorTerminate();
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
      onNewChat={handleNewChat}
      onClose={handleClose}
    />
  );

  const headerHeight = 57;
  const connectionStatusHeight = !isConnected && !otherUserLeft && !timeUp ? 41 : 0;
  const inputHeight = 73;

  return (
    <div className="fixed inset-0 bg-navy overflow-hidden">
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerHeight, zIndex: 50 }}>
        <ChatHeader
          isConnected={isConnected}
          timeLeft={timeLeft}
          formatTime={formatTime}
          onTerminate={handleTerminate}
          onExtend={() => {}}
          isTerminated={otherUserLeft || timeUp}
        />
      </div>

      {/* Connection Banner */}
      <ConnectionBanner
        isConnected={isConnected}
        otherUserLeft={otherUserLeft}
        timeUp={timeUp}
        headerHeight={headerHeight}
      />

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        style={{
          position: 'absolute',
          top: headerHeight + connectionStatusHeight,
          bottom: inputHeight + (otherUserLeft || timeUp ? 0 : keyboardHeight),
          left: 0,
          right: 0,
          overflowY: 'auto',
          padding: '1rem 0.5rem 1rem 1rem',
          scrollbarWidth: 'thin',
          scrollbarColor: '#64FFDA #0A192F',
          transition: 'bottom 0.2s ease-out'
        }}
        className="scrollbar-thin scrollbar-thumb-sky scrollbar-track-navy"
      >
        <div className="max-w-4xl mx-auto">
          <MessageContainer
            messages={messages}
            otherUserTyping={otherUserTyping}
            otherUserLeft={otherUserLeft}
            timeUp={timeUp}
            onViewFile={handleViewFile}
            messagesEndRef={messagesEndRef}
          />
        </div>
      </div>

      {/* Input Area */}
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
            transition: 'bottom 0.2s ease-out'
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-3">
            <ChatInputControls
              inputText={inputText}
              isConnected={isConnected}
              isSendingFile={isSendingFile || isUploading}
              isTerminating={isTerminating}
              otherUserLeft={otherUserLeft}
              timeUp={timeUp}
              onInputChange={handleTypingWrapper}
              onSend={handleSend}
              onAttachmentClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              inputRef={inputRef}
            />
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
          <TerminationActions onTerminate={handleSecondUserTerminate} />
        </div>
      )}

      {/* Attachment Menu */}
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

      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Media Error Message */}
      {mediaError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg z-50">
          {mediaError}
        </div>
      )}

      {/* Modals */}
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
