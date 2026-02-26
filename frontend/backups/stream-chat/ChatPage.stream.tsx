import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleChat from '../components/simple-chat/SimpleChat';

const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const encryptionKey = window.location.hash.substring(1);

  if (!sessionId || !encryptionKey) {
    return null;
  }

  // Generate a consistent user ID
  const userId = `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <SimpleChat
      sessionId={sessionId}
      userId={userId}
      onTerminate={() => navigate('/')}
    />
  );
};

export default ChatPage;
