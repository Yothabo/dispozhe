import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative bg-navy-light border-t border-white/10 rounded-t-2xl w-full max-w-4xl mx-auto shadow-2xl animate-slide-up"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-grey hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="prose prose-invert max-w-none">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
