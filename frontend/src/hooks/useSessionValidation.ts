import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseSessionValidationProps {
  sessionId: string;
  redirectTo?: string;
}

export const useSessionValidation = ({ 
  sessionId, 
  redirectTo = '/' 
}: UseSessionValidationProps) => {
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/session/${sessionId}/status`);
        
        if (!mounted) return;

        if (response.status === 404) {
          // Session doesn't exist - terminated
          setIsValid(false);
          setChecking(false);
          navigate(redirectTo, { replace: true });
          return;
        }

        if (!response.ok) {
          setIsValid(false);
          setChecking(false);
          navigate(redirectTo, { replace: true });
          return;
        }

        const data = await response.json();
        
        if (!mounted) return;

        // Check if session is expired or terminated
        if (data.status === 'expired' || data.status === 'terminated') {
          setIsValid(false);
          setChecking(false);
          navigate(redirectTo, { replace: true });
          return;
        }

        // Session is valid
        setIsValid(true);
        setChecking(false);
        
      } catch (error) {
        console.error('Session validation error:', error);
        if (mounted) {
          setIsValid(false);
          setChecking(false);
          navigate(redirectTo, { replace: true });
        }
      }
    };

    if (sessionId) {
      validateSession();
    }

    return () => {
      mounted = false;
    };
  }, [sessionId, navigate, redirectTo]);

  return { isValid, checking };
};
