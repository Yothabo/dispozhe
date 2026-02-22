import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Lazy load the heavy Stream Chat component
const StreamChatWrapper = lazy(() => import('../stream/StreamChatWrapper'));

// Loading component
const LoadingChat = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-navy">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-grey text-lg font-light">Loading chat...</p>
    </div>
  </div>
);

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
  const apiBaseUrl = api.getBaseUrl();
  
  const userId = `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleTerminate = () => {
    onTerminate();
    navigate('/');
  };

  return (
    <Suspense fallback={<LoadingChat />}>
      <StreamChatWrapper
        sessionId={sessionId}
        userId={userId}
        onTerminate={handleTerminate}
        apiBaseUrl={apiBaseUrl}
      />
    </Suspense>
  );
};

export default ActiveChat;
