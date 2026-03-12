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
  const [error, setError] = useState<string | null>(null);
  const polling = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNavigated = useRef<boolean>(false);
  const isInitiator = useRef<boolean>(false);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      return;
    }

    const rawKey = window.location.hash.substring(1);
    let key = '';

    try {
      key = decodeURIComponent(rawKey);
      if (!key || key.length === 0) {
        key = rawKey;
      }
    } catch {
      key = rawKey;
    }

    const fullLink = `${window.location.origin}/c/${sessionId}#${key}`;
    setLink(fullLink);

    const initiatorFlag = sessionStorage.getItem(`Driflly_initiator_${sessionId}`);
    isInitiator.current = initiatorFlag === 'true';

    api.getSessionStatus(sessionId)
      .then(status => {
        const mins = status.time_left_seconds ? Math.ceil(status.time_left_seconds / 60) : 30;
        setDuration(mins);
      })
      .catch(() => {});

    const sessionCode = sessionStorage.getItem(`Driflly_code_${sessionId}`);
    if (sessionCode) {
      setCode(sessionCode);
    }

    const poll = async () => {
      if (hasNavigated.current) return;
      try {
        const status = await api.getSessionStatus(sessionId);
        if (status.status === 'active' && status.participant_count === 2) {
          hasNavigated.current = true;
          if (polling.current) {
            clearInterval(polling.current);
            polling.current = null;
          }
          try {
            await wsService.connect(sessionId);
          } catch {
            // Silently fail - will show connection status in chat
          }
          navigate(`/chat/${sessionId}#${key}`, { replace: true });
        }
      } catch {
        // Silently fail poll attempts
      }
    };

    poll();
    polling.current = setInterval(poll, 2000);

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
      } catch {
        // Silently fail termination
      }
    }
    navigate('/');
  };

  if (error) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-400 mb-4">⚠️</div>
            <p className="text-grey">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-sky text-navy rounded-lg"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-grey text-sm font-light">Creating secure session...</p>
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
          _duration={duration}
          _sessionId={sessionId!}
          onCopy={() => {}}
          onCopyCode={() => {}}
          onTerminate={handleTerminate}
        />
      </div>
    </div>
  );
};

export default WaitingPage;
