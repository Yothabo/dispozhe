import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks
import {
  useChatMessages,
  useChatConnection,
  useChatTermination,
  useChatBackNavigation,
  useFileHandling,
  useChatTimer,
  useChatTyping
} from './hooks';
import { useChatMessageHandlers } from './hooks/useChatMessageHandlers';

// Components
import ChatHeader from './header/ChatHeader';
import MessageContainer from './messages/MessageContainer';
import AttachmentMenu from './file/AttachmentMenu';
import FileViewer from './file/FileViewer';
import TerminationModal from './termination/TerminationModal';
import DestroyingSessionView from './termination/views/DestroyingSessionView';
import SessionDestroyedView from './termination/views/SessionDestroyedView';
import ConnectionBanner from './connection/ConnectionBanner';
import ChatInputControls from './input/ChatInputControls';
import TerminationActions from './termination/TerminationActions';

// Utils
import useKeyboard from '../../hooks/useKeyboard';
import wsService from '../../services/websocket';
import { notifyManagement } from '../NotificationCenter';
import { preventRefresh, disableRefreshKeys } from '../../utils/preventRefresh';

// Types
import { Message } from './types';

interface ActiveChatProps {
  sessionId: string;
  duration: number;
  encryptionKey: string;
  onTerminate: () => void;
  onCreateNew?: () => void;
}

const ActiveChat: React.FC<ActiveChatProps> = ({
  sessionId,
  duration,
  encryptionKey,
  onTerminate,
  onCreateNew
}) => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const animationTimeouts = useRef<NodeJS.Timeout[]>([]);
  const handlerRegistered = useRef<boolean>(false);
  const terminationMessageShown = useRef<boolean>(false);
  const timeUpMessageShown = useRef<boolean>(false);

  const keyboardHeight = useKeyboard();

  // Custom hooks
  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    handleIncomingMessage,
    markFileAsViewed,
    processedIds,
    fileChunks,
    viewedFiles
  } = useChatMessages(sessionId);

  const { isConnected: wsConnected } = useChatConnection(sessionId, () => {});

  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  const {
    otherUserTyping,
    setOtherUserTyping,
    lastTypingSent,
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
      sessionStorage.setItem(`Driflly_messages_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId, isTerminating, terminationCompleted, otherUserLeft, showSecondUserTermination]);

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

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      animationTimeouts.current.forEach(clearTimeout);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [typingTimeoutRef]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Fixed handleSend function with proper Unicode/emoji support
  const handleSend = () => {
    if (!inputText.trim() || !isConnected || isTerminating || otherUserLeft || showSecondUserTermination || timeUp) return;

    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    
    // Proper Unicode handling for emojis
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

  // Dummy handlers for future file types
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

      {/* Attachment Menu - only Image is active */}
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

      {/* Hidden file input - only for images now */}
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
