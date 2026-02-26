import React from 'react'
import { FaTrash } from 'react-icons/fa'
import TerminationSteps from '../chat/termination/TerminationSteps'

interface TerminationStep {
  id: number;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

interface TerminateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  steps: TerminationStep[]
}

const TerminateSessionModal: React.FC<TerminateSessionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  steps
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <FaTrash className="w-6 h-6 text-red-400" />
        </div>

        <h3 className="text-white text-xl font-bold text-center mb-4">
          Terminate Session
        </h3>

        <TerminationSteps steps={steps} className="mb-6" />

        <div className="flex gap-3">
          <button
            onClick={onClose}
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

export default TerminateSessionModal;
