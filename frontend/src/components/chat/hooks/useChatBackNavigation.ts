import { useEffect } from 'react';

export const useChatBackNavigation = (
  setShowTerminateModal: (show: boolean) => void,
  terminationCompleted: boolean
) => {
  // Handle back navigation - show termination modal
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      window.history.pushState(null, '', window.location.href);
      setShowTerminateModal(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setShowTerminateModal]);

  // Prevent back navigation after termination
  useEffect(() => {
    if (terminationCompleted) {
      window.history.replaceState(null, '', '/');
      
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        window.location.href = '/';
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [terminationCompleted]);
};
