import React, { useEffect, useState, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

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
  }, [isOpen, handleClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isClosing, handleClose]);

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-navy/80 backdrop-blur-sm"
        onClick={handleClose}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center pointer-events-none`}
      >
        <div
          className={`relative bg-navy-light border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:w-3/4 lg:w-2/3 xl:w-1/2 sm:max-w-3xl shadow-2xl transition-all duration-300 ease-out flex flex-col pointer-events-auto h-full sm:h-[80vh] max-h-[800px] ${
            isClosing ? 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95' : 'translate-y-0 opacity-100 sm:scale-100'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Header - fixed at top */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
            <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
            <button
              onClick={handleClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClose();
                }
              }}
              className="p-2 text-grey hover:text-white transition-colors rounded-lg hover:bg-white/5"
              aria-label="Close modal"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="prose prose-invert max-w-none">
              {content}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LegalModal;
