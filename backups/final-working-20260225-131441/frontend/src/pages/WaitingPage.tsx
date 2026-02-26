import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WaitingScreen from '../components/chat/WaitingScreen';
import api from '../services/api';
import wsService from '../services/websocket';
import Background from '../components/Background';

const WaitingPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const polling = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNavigated = useRef<boolean>(false);

  useEffect(() => {
    if (!sessionId) return;

    const key = window.location.hash.substring(1);
    const fullLink = `${window.location.origin}/c/${sessionId}#${key}`;
    setLink(fullLink);

    // Get session details - don't await, let it happen in background
    api.getSessionStatus(sessionId).then(status => {
      const mins = status.time_left_seconds ? Math.ceil(status.time_left_seconds / 60) : 30;
      setDuration(mins);
    }).catch(console.error);

    // Get code from sessionStorage
    const sessionCode = sessionStorage.getItem(`Driflly_code_${sessionId}`);
    if (sessionCode) {
      setCode(sessionCode);
    }

    // Poll for participant joining - faster polling
    const poll = async () => {
      if (hasNavigated.current) return;

      try {
        const status = await api.getSessionStatus(sessionId);
        
        if (status.status === 'active' && status.participant_count === 2) {
          hasNavigated.current = true;

          // Clear interval immediately
          if (polling.current) {
            clearInterval(polling.current);
            polling.current = null;
          }

          // Connect WebSocket in background - don't wait for it
          wsService.connect(sessionId).catch(console.error);

          // Navigate immediately
          navigate(`/chat/${sessionId}#${key}`, { replace: true });
        }
      } catch (err) {
        console.error('[WaitingPage] Poll failed:', err);
      }
    };

    // Start polling - fast 1 second polling
    poll();
    polling.current = setInterval(poll, 1000);

    return () => {
      if (polling.current) {
        clearInterval(polling.current);
        polling.current = null;
      }
    };
  }, [sessionId, navigate]);

  const handleTerminate = async () => {
    if (sessionId) {
      try {
        await api.terminateSession(sessionId);
        sessionStorage.removeItem(`Driflly_initiator_${sessionId}`);
        sessionStorage.removeItem(`Driflly_code_${sessionId}`);
        wsService.disconnect();
      } catch (err) {
        console.error('Failed to terminate:', err);
      }
    }
    navigate('/');
  };

  if (!link) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-grey text-sm font-light">Generating secure link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10">
        <WaitingScreen
          link={link}
          code={code}
          duration={duration}
          sessionId={sessionId!}
          onCopy={() => {}}
          onCopyCode={() => {}}
          onTerminate={handleTerminate}
        />
      </div>
    </div>
  );
};

export default WaitingPage;
