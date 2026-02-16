import React from 'react';
import { FaHome, FaPlusCircle } from 'react-icons/fa';

interface SessionDestroyedViewProps {
  onNewChat: () => void;
  onClose: () => void;
}

const SessionDestroyedView: React.FC<SessionDestroyedViewProps> = ({ onNewChat, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-navy/95 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm mx-auto border border-white/10">
        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-green-400 text-2xl">✓</span>
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">
          Session Destroyed
        </h3>
        <p className="text-grey text-xs text-center mb-6">
          All traces have been permanently removed from the server.
        </p>
        <div className="space-y-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky text-navy rounded-xl text-sm font-medium hover:bg-sky-dark transition-colors"
          >
            <FaPlusCircle className="w-4 h-4" />
            New Chat
          </button>
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            <FaHome className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDestroyedView;
