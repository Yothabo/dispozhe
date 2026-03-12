import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Generating secure keys...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateEncryptionKey = (): string => {
    try {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      let binary = '';
      for (let i = 0; i < array.length; i++) {
        binary += String.fromCharCode(array[i]);
      }
      const key = btoa(binary);
      if (!key || key.length === 0) {
        throw new Error('Generated key is empty');
      }
      return key;
    } catch {
      throw new Error('Failed to generate encryption key');
    }
  };

  useEffect(() => {
    let mounted = true;

    const createSession = async () => {
      try {
        setStatus('Generating encryption keys...');
        setProgress(25);
        const key = generateEncryptionKey();
        if (!key || key.length === 0) {
          throw new Error('Failed to generate encryption key');
        }
        setProgress(50);
        setStatus('Creating secure session...');
        const response = await api.createSession(5);
        if (!response || !response.session_id) {
          throw new Error('Invalid server response');
        }
        setProgress(75);
        setStatus('Preparing your chat...');
        sessionStorage.setItem(`Driflly_initiator_${response.session_id}`, 'true');
        if (response.code) {
          sessionStorage.setItem(`Driflly_code_${response.session_id}`, response.code);
        }
        const encodedKey = encodeURIComponent(key);
        if (!encodedKey || encodedKey.length === 0) {
          throw new Error('Key encoding failed');
        }
        const fullUrl = `/waiting/${response.session_id}#${encodedKey}`;
        setProgress(100);
        if (mounted) {
          setTimeout(() => {
            navigate(fullUrl);
          }, 200);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to create session');
          setStatus('Failed to create session. Redirecting...');
          setTimeout(() => navigate('/'), 2000);
        }
      }
    };
    createSession();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h2 className="text-xl text-white mb-3">Something went wrong</h2>
          <p className="text-grey mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-sky text-navy rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-navy">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 border-4 border-sky border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl text-white mb-3">Creating Your Secure Chat</h2>
        <p className="text-grey mb-6">{status}</p>
        <div className="w-full bg-white/5 rounded-full h-2 mb-4">
          <div
            className="bg-sky h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-grey/50 text-sm">
          Default duration: 5 minutes • You can extend in-chat
        </p>
      </div>
    </div>
  );
};

export default CreateSessionPage;
