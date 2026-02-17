import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Background from '../components/Background';

const ChatJoin: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const joinAttempted = useRef(false);

  useEffect(() => {
    const join = async () => {
      // Prevent multiple join attempts
      if (joinAttempted.current) return;
      
      if (!sessionId) {
        console.error('[ChatJoin] No sessionId');
        navigate('/');
        return;
      }

      try {
        const key = window.location.hash.substring(1);
        if (!key) {
          console.error('[ChatJoin] No encryption key');
          navigate('/');
          return;
        }

        console.log('[ChatJoin] Joining session:', sessionId);
        joinAttempted.current = true;

        // Check session status
        const status = await api.getSessionStatus(sessionId);

        if (status.status === 'expired') {
          console.log('[ChatJoin] Session expired');
          navigate('/');
          return;
        }

        // If session already has 2 participants, go directly to chat
        if (status.participant_count >= 2) {
          console.log('[ChatJoin] Session already active, going to chat');
          navigate(`/chat/${sessionId}#${key}`, { replace: true });
          return;
        }

        const isInitiator = sessionStorage.getItem(`chatlly_initiator_${sessionId}`) === 'true';
        if (isInitiator) {
          console.log('[ChatJoin] User is initiator, going to waiting');
          navigate(`/waiting/${sessionId}#${key}`, { replace: true });
          return;
        }

        console.log('[ChatJoin] Joining session as second participant');
        const joinResult = await api.joinSession(sessionId);
        
        if (joinResult.status === 'active') {
          console.log('[ChatJoin] Join successful, going to chat');
          navigate(`/chat/${sessionId}#${key}`, { replace: true });
        } else {
          console.error('[ChatJoin] Join failed:', joinResult);
          navigate('/');
        }
      } catch (err) {
        console.error('[ChatJoin] Join failed:', err);
        navigate('/');
      }
    };

    join();
  }, [sessionId, navigate]);

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey text-sm font-light">Joining secure session...</p>
        </div>
      </div>
    </div>
  );
};

export default ChatJoin;
