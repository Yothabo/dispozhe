import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface ChatContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ isOpen, onClose, children, title = "Private Chat" }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

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
      {/* Backdrop - interactive element with role="button" */}
      <div
        className="fixed inset-0 z-40 bg-navy/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close chat"
      />

      {/* Chat Container - non-interactive container */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center pointer-events-none`}
      >
        <div
          className={`relative bg-navy-light border-t border-white/10 rounded-t-2xl w-full sm:w-[70vh] shadow-2xl transition-all duration-300 ease-out flex flex-col pointer-events-auto ${
            isClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
          }`}
          style={{
            height: '100%',
            maxHeight: '100%',
            width: '100%'
          }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0" style={{ height: '10%', minHeight: '48px' }}>
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

          <div className="flex-1 overflow-hidden" style={{ height: '90%' }}>
            {children}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .fixed.inset-0 > div:last-child {
            height: 70vh !important;
            width: 70vh !important;
            max-height: 70vh !important;
            max-width: 70vh !important;
          }
        }
      `}</style>
    </>
  );
};

export default ChatContainer;
