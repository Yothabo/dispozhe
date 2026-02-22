import { useState, useEffect } from 'react';

const useKeyboard = (): number => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Only run on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      setKeyboardHeight(0);
      return;
    }

    const handleResize = () => {
      // Get the visual viewport height
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      // Get the window inner height
      const windowHeight = window.innerHeight;

      // Calculate keyboard height (when visual viewport is smaller than window)
      // Only consider it a keyboard if the difference is significant (>100px)
      const height = Math.max(0, windowHeight - visualViewport.height);
      
      // Only update if significant change (keyboard open/close)
      if (height > 100 || height === 0) {
        setKeyboardHeight(height);
      }
    };

    // Add event listeners
    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);

    // Initial check
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  return keyboardHeight;
};

export default useKeyboard;
