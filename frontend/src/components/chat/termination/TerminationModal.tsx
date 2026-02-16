import React from 'react';
import { FaTimesCircle, FaTrash, FaCheck, FaSpinner } from 'react-icons/fa';

export type TerminationStep = {
  id: number;
  label: string;
  status: 'pending' | 'loading' | 'completed';
};

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
  if (!show && !isTerminating) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 max-w-md w-full border border-white/10">
        {!isTerminating ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <FaTimesCircle className="w-6 h-6 text-red-400" />
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-4">Terminate Session</h3>
            
            <div className="space-y-2 mb-6">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2 text-grey">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-grey/50"></div>
                  </div>
                  <span className="text-xs">{step.label}</span>
                </div>
              ))}
            </div>
            
            <p className="text-red-400 text-xs text-center mb-6">
              This action cannot be undone. The other participant will be notified.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-3 py-2 bg-white/5 text-white rounded-lg text-xs font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
              >
                Terminate
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <FaTrash className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-4">Destroying Session</h3>
            
            <div className="space-y-2 mb-4">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {step.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-grey/50"></div>}
                    {step.status === 'loading' && <FaSpinner className="w-3 h-3 text-sky animate-spin" />}
                    {step.status === 'completed' && <FaCheck className="w-3 h-3 text-sky" />}
                  </div>
                  <span className={`text-xs ${step.status === 'completed' ? 'text-sky' : 'text-grey'}`}>
                    {step.label}
                  </span>
                  {step.status === 'completed' && (
                    <span className="text-[10px] text-sky/70 ml-auto">Destroyed</span>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-center text-grey text-xs">
              All traces are being permanently removed...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default TerminationModal;
