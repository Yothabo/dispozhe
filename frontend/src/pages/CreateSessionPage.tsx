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
    return btoa(String.fromCharCode(...array));
  };

  const handleDurationSelect = async (minutes: number) => {
    try {
      // Generate key and create session in parallel
      const [key, response] = await Promise.all([
        generateEncryptionKey(),
        api.createSession(minutes)
      ]);

      sessionStorage.setItem(`Driflly_initiator_${response.session_id}`, 'true');

      if (response.code) {
        sessionStorage.setItem(`Driflly_code_${response.session_id}`, response.code);
      }

      // Navigate immediately - don't wait for anything else
      navigate(`/waiting/${response.session_id}#${key}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      throw err; // Re-throw so loading state can be cleared
    }
  };

  return (
    <DurationSelector onSelect={handleDurationSelect} onClose={onExit} />
  );
};

export default CreateSessionPage;
