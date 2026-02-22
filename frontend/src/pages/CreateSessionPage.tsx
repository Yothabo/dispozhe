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
    console.log('CreateSessionPage: Generating encryption key');
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    let binary = '';
    for (let i = 0; i < array.length; i++) {
      binary += String.fromCharCode(array[i]);
    }
    const key = btoa(binary);
    console.log('CreateSessionPage: Key generated');
    return key;
  };

  const handleDurationSelect = async (minutes: number) => {
    console.log('CreateSessionPage: handleDurationSelect called with minutes:', minutes);
    
    try {
      console.log('CreateSessionPage: Generating key and creating session in parallel');
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
      console.log('CreateSessionPage: Set initiator flag in sessionStorage');

      if (response.code) {
        sessionStorage.setItem(`Driflly_code_${response.session_id}`, response.code);
        console.log('CreateSessionPage: Set code in sessionStorage');
      }

      const navigatePath = `/waiting/${response.session_id}#${key}`;
      console.log('CreateSessionPage: Navigating to:', navigatePath);
      
      // Navigate immediately
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
