import React from 'react';
import { FaTrash } from 'react-icons/fa';
import TerminationSteps from '../TerminationSteps';

interface TerminationStep {
  id: number;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

interface DestroyingSessionViewProps {
  steps: TerminationStep[];
}

const DestroyingSessionView: React.FC<DestroyingSessionViewProps> = ({ steps }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <FaTrash className="w-6 h-6 text-red-400" />
        </div>

        <h3 className="text-white text-xl font-bold text-center mb-4">
          Destroying Session
        </h3>

        <TerminationSteps steps={steps} className="mb-6" />

        <p className="text-grey text-sm text-center">
          Please wait while we securely delete all session data...
        </p>
      </div>
    </div>
  );
};

export default DestroyingSessionView;
