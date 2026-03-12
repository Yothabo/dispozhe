import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ActiveChat from '../components/chat/ActiveChat';

const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const encryptionKey = window.location.hash.substring(1);

  if (!sessionId || !encryptionKey) {
    console.error('Missing sessionId or encryption key');
    navigate('/');
    return null;
  }

  const handleClose = () => {
    navigate('/');
  };

  return (
    <ActiveChat
      sessionId={sessionId}
      duration={5}
      encryptionKey={encryptionKey}
      onTerminate={handleClose}
    />
  );
};

export default ChatPage;
