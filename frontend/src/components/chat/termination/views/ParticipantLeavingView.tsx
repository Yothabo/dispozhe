import React from 'react';
import { FaTimesCircle } from 'react-icons/fa';
import TerminationStepItem from '../steps/TerminationStepItem';

interface TerminationStep {
  id: number;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

interface ParticipantLeavingViewProps {
  steps: TerminationStep[];
}

const ParticipantLeavingView: React.FC<ParticipantLeavingViewProps> = ({ steps }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-navy/95 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm mx-auto border border-white/10">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
          <FaTimesCircle className="w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">
          Participant Leaving
        </h3>
        <p className="text-grey text-xs text-center mb-4">
          The other participant has initiated session termination.
        </p>
        <div className="space-y-2 mb-4">
          {steps.map((step) => (
            <TerminationStepItem key={step.id} label={step.label} status={step.status} />
          ))}
        </div>
        <p className="text-center text-grey text-xs">
          Session is being destroyed...
        </p>
      </div>
    </div>
  );
};

export default ParticipantLeavingView;
