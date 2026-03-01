import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ActiveChat from '../components/chat/ActiveChat';
import ErrorBoundary from '../components/ErrorBoundary';
import { useSessionValidation } from '../hooks/useSessionValidation';

const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const encryptionKey = window.location.hash.substring(1);

  // Validate session on mount
  const { checking } = useSessionValidation({ 
    sessionId: sessionId || '', 
    redirectTo: '/' 
  });

  useEffect(() => {
    // If no sessionId or key, redirect home
    if (!sessionId || !encryptionKey) {
      navigate('/', { replace: true });
    }
  }, [sessionId, encryptionKey, navigate]);

  if (!sessionId || !encryptionKey || checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey text-sm font-light">
            {checking ? 'Validating session...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  const handleClose = () => {
    navigate('/', { replace: true });
  };

  return (
    <ErrorBoundary>
      <ActiveChat
        sessionId={sessionId}
        duration={5}
        encryptionKey={encryptionKey}
        onTerminate={handleClose}
      />
    </ErrorBoundary>
  );
};

export default ChatPage;
