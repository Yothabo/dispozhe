import { useState, useEffect } from 'react';

const useKeyboard = (): number => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // For iOS Safari
    const handleVisualViewport = () => {
      if (window.visualViewport) {
        const windowHeight = window.innerHeight;
        const visualHeight = window.visualViewport.height;
        // Calculate keyboard height as the difference
        const height = Math.max(0, windowHeight - visualHeight);
        
        // Only update if significant change (keyboard open/close)
        if (Math.abs(height - keyboardHeight) > 50) {
          setKeyboardHeight(height);
        }
      }
    };

    // For Android and other browsers
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      const height = Math.max(0, documentHeight - windowHeight);
      
      if (Math.abs(height - keyboardHeight) > 50) {
        setKeyboardHeight(height);
      }
    };

    // Use visualViewport API for more accurate keyboard detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewport);
      // Initial check
      handleVisualViewport();
    } else {
      window.addEventListener('resize', handleResize);
      handleResize();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewport);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [keyboardHeight]);

  return keyboardHeight;
};

export default useKeyboard;
