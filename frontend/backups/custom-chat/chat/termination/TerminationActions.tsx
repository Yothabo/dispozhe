import React from 'react';
import { FaTrash } from 'react-icons/fa';

interface TerminationActionsProps {
  onTerminate: () => void;
  label?: string;
}

const TerminationActions: React.FC<TerminationActionsProps> = ({ 
  onTerminate, 
  label = "Terminate session" 
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 w-full">
      <button
        onClick={onTerminate}
        className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors text-sm font-medium border border-red-500/20 hover:border-red-500/50 flex items-center justify-center gap-2"
      >
        <FaTrash className="w-4 h-4" />
        <span>{label}</span>
      </button>
    </div>
  );
};

export default TerminationActions;
