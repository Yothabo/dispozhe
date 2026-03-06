import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DurationSelector from '../components/chat/DurationSelector';
import api from '../services/api';

interface CreateSessionPageProps {
  onExit: () => void;
}

const CreateSessionPage: React.FC<CreateSessionPageProps> = ({ onExit }) => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const generateEncryptionKey = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    let binary = '';
    for (let i = 0; i < array.length; i++) {
      binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
  };

  const handleDurationSelect = async (minutes: number) => {
    if (isCreating) return;

    setIsCreating(true);

    const key = generateEncryptionKey();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await api.createSession(minutes);
      clearTimeout(timeoutId);

      sessionStorage.setItem(`Driflly_initiator_${response.session_id}`, 'true');

      if (response.code) {
        sessionStorage.setItem(`Driflly_code_${response.session_id}`, response.code);
      }

      navigate(`/waiting/${response.session_id}#${key}`);

    } catch (err) {
      setIsCreating(false);
      console.error('Failed to create session:', err);

      if (err instanceof Error && err.name === 'AbortError') {
        alert('Request timed out. Please try again.');
      } else {
        alert('Failed to create session. Please check your connection and try again.');
      }
    }
  };

  return (
    <DurationSelector
      onSelect={handleDurationSelect}
      onClose={onExit}
    />
  );
};

export default CreateSessionPage;
