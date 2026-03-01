import React from 'react';
import { useNavigate } from 'react-router-dom';
import DurationSelector from '../components/chat/DurationSelector';
import api from '../services/api';

interface CreateSessionPageProps {
  onExit: () => void;
}

const CreateSessionPage: React.FC<CreateSessionPageProps> = ({ onExit }) => {
  const navigate = useNavigate();

  const generateEncryptionKey = async (): Promise<string> => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    let binary = '';
    for (let i = 0; i < array.length; i++) {
      binary += String.fromCharCode(array[i]);
    }
    const key = btoa(binary);
    return key;
  };

  const handleDurationSelect = async (minutes: number) => {
    try {
      const [key, response] = await Promise.all([
        generateEncryptionKey(),
        api.createSession(minutes)
      ]);

      console.log('CreateSessionPage: Session created successfully:', {
        sessionId: response.session_id,
        hasCode: !!response.code,
        duration: response.duration
      });

      sessionStorage.setItem(`Driflly_initiator_${response.session_id}`, 'true');

      if (response.code) {
        sessionStorage.setItem(`Driflly_code_${response.session_id}`, response.code);
      }

      const navigatePath = `/waiting/${response.session_id}#${key}`;
      navigate(navigatePath);

    } catch (err) {
      console.error('CreateSessionPage: Failed to create session:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <DurationSelector onSelect={handleDurationSelect} onClose={onExit} />
  );
};

export default CreateSessionPage;
