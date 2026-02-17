import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaPlus } from 'react-icons/fa';

interface SessionDestroyedViewProps {
  onNewChat: () => void;
  onClose: () => void;
}

const SessionDestroyedView: React.FC<SessionDestroyedViewProps> = ({ onNewChat, onClose }) => {
  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate('/create');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-sky/10 flex items-center justify-center mx-auto mb-6 border border-sky/20">
          <FaCheck className="w-8 h-8 text-sky" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3 text-center">Session Destroyed</h2>
        <p className="text-grey mb-8 text-center">
          The chat session has been permanently deleted. All data has been wiped from our servers.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={handleNewChat}
            className="flex-1 px-4 py-3 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark transition-colors flex items-center justify-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            New Chat
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDestroyedView;
