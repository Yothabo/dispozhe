import React, { useEffect, useState } from 'react';
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

  // Handle open/close animations
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isClosing]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-navy/80 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Modal - attached to bottom on all screens */}
      <div
        className={`relative bg-navy-light border-t border-white/10 rounded-t-2xl w-full sm:w-3/4 lg:w-2/3 xl:w-1/2 sm:max-w-3xl shadow-2xl transition-all duration-300 ease-out flex flex-col h-[55vh] sm:h-[60vh] lg:h-[65vh] max-h-[700px] ${
          isClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - fixed at top */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
          <button
            onClick={handleClose}
            className="p-2 text-grey hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Close modal"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="prose prose-invert max-w-none">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
