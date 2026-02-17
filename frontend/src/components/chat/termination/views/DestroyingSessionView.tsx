import React from 'react';
import { FaTimesCircle } from 'react-icons/fa';
import TerminationStepItem from '../steps/TerminationStepItem';

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
    <div className="fixed inset-0 flex items-center justify-center bg-navy/95 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm mx-auto border border-white/10">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <FaTimesCircle className="w-6 h-6 text-red-400 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-4">
          Destroying Session
        </h3>
        <div className="space-y-2 mb-4">
          {steps.map((step) => (
            <TerminationStepItem key={step.id} label={step.label} status={step.status} />
          ))}
        </div>
        <p className="text-center text-grey text-xs">
          All traces are being permanently removed...
        </p>
      </div>
    </div>
  );
};

export default DestroyingSessionView;
