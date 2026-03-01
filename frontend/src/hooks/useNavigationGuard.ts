import { useEffect, useRef } from 'react';

interface UseNavigationGuardProps {
  isActive: boolean;
  onBack: () => void;
}

export const useNavigationGuard = ({
  isActive,
  onBack
}: UseNavigationGuardProps) => {
  const hasPushedState = useRef(false);
  const processingBack = useRef(false);

  useEffect(() => {
    if (!isActive) return;

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();

      if (processingBack.current) {
        return;
      }

      processingBack.current = true;

      window.history.pushState(null, '', window.location.pathname);

      onBack();

      setTimeout(() => {
        processingBack.current = false;
      }, 1000);
    };

    if (!hasPushedState.current) {
      window.history.pushState(null, '', window.location.pathname);
      hasPushedState.current = true;
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isActive, onBack]);
};
