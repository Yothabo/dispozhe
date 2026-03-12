import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface ChatContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title = "Private Chat" 
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // WhatsApp-style keyboard detection
  useEffect(() => {
    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardGuess = windowHeight - viewportHeight;
        
        if (keyboardGuess > 100) {
          setKeyboardHeight(keyboardGuess);
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsClosing(false), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isClosing, onClose]);

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-navy/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close chat"
      />

      {/* Chat Container - WhatsApp style absolute positioning */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div
          className={`absolute bg-navy-light border border-white/10 shadow-2xl transition-all duration-300 ease-out flex flex-col pointer-events-auto ${
            isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(90vw, 800px)',
            height: 'min(80vh, 600px)',
            maxHeight: 'calc(100vh - 40px)',
            borderRadius: '24px',
          }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <span className="text-xs text-grey/50 px-2 py-0.5 bg-white/5 rounded-full">E2EE</span>
            </div>
            <button
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClose();
                }
              }}
              className="p-2 text-grey hover:text-white transition-colors rounded-lg hover:bg-white/5"
              aria-label="Close chat"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Content - with keyboard padding */}
          <div 
            className="flex-1 overflow-hidden"
            style={{ 
              paddingBottom: keyboardHeight,
              transition: 'padding-bottom 0.2s ease'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatContainer;
