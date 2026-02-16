import { useState, useEffect } from 'react';

const useKeyboard = (): number => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Use visualViewport API for more accurate keyboard detection
    const handleVisualViewport = () => {
      if (window.visualViewport) {
        // Calculate keyboard height as the difference between window innerHeight and visualViewport height
        const windowHeight = window.innerHeight;
        const visualHeight = window.visualViewport.height;
        const height = Math.max(0, windowHeight - visualHeight);
        
        // Only update if significant change (keyboard open/close)
        if (Math.abs(height - keyboardHeight) > 50) {
          setKeyboardHeight(height);
        }
      }
    };

    // Listen to visualViewport resize events
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewport);
      // Initial check
      handleVisualViewport();
    }

    // Fallback for browsers without visualViewport
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      const height = Math.max(0, documentHeight - windowHeight);
      
      if (Math.abs(height - keyboardHeight) > 50) {
        setKeyboardHeight(height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewport);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [keyboardHeight]);

  return keyboardHeight;
};

export default useKeyboard;
