import React from 'react';
import { FaTimes, FaTrash, FaSpinner, FaCheck } from 'react-icons/fa';
import { TerminationStep } from '../types';

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
          <FaTrash className="w-6 h-6 text-red-400" />
        </div>
        
        <h3 className="text-white text-xl font-bold text-center mb-4">
          Terminate Session
        </h3>
        
        <div className="space-y-3 mb-6">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                {step.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-grey/30"></div>}
                {step.status === 'loading' && <FaSpinner className="w-3 h-3 text-sky animate-spin" />}
                {step.status === 'completed' && <FaCheck className="w-3 h-3 text-sky" />}
              </div>
              <span className={`text-sm ${step.status === 'completed' ? 'text-sky font-bold' : 'text-grey font-light'}`}>
                {step.label}
              </span>
              {step.status === 'completed' && <span className="text-xs text-sky/50 ml-auto font-light">✓</span>}
            </div>
          ))}
        </div>
        
        <div className="flex gap-3">
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
        </div>
      </div>
    </div>
  );
};

export default TerminationModal;
