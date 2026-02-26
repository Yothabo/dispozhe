import React from 'react';
import { FaTrash, FaCheck } from 'react-icons/fa';

import { TerminationStep } from '../types';

import TerminationSteps from './TerminationSteps';

interface TerminationModalProps {
  show: boolean;
  isTerminating: boolean;
  steps: TerminationStep[];
  onConfirm: () => void;
  onCancel: () => void;
}

const TerminationModal: React.FC<TerminationModalProps> = ({
  show,
  isTerminating,
  steps,
  onConfirm,
  onCancel
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          {!isTerminating ? (
            <FaTrash className="w-6 h-6 text-red-400" />
          ) : (
            <FaCheck className="w-6 h-6 text-sky" />
          )}
        </div>
        
        <h3 className="text-white text-xl font-bold text-center mb-4">
          {!isTerminating ? 'Terminate Session' : 'Session Destroyed'}
        </h3>
        
        <TerminationSteps steps={steps} className="mb-6" />
        
        <div className="flex gap-3">
          {!isTerminating ? (
            <>
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 hover:border-red-500/50"
              >
                Terminate
              </button>
            </>
          ) : (
            <button
              onClick={onCancel}
              className="w-full px-4 py-3 bg-sky/10 text-sky rounded-xl font-bold hover:bg-sky/20 transition-colors border border-sky/20"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TerminationModal;
