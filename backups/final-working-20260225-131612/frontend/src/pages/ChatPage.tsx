import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ActiveChat from '../components/chat/ActiveChat';
import ErrorBoundary from '../components/ErrorBoundary';

const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const encryptionKey = window.location.hash.substring(1);

  if (!sessionId || !encryptionKey) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ActiveChat
        sessionId={sessionId}
        duration={5}
        encryptionKey={encryptionKey}
        onTerminate={() => navigate('/')}
      />
    </ErrorBoundary>
  );
};

export default ChatPage;
