import React from 'react';
import { FaCheck, FaSpinner } from 'react-icons/fa';

import { TerminationStep } from '../types';

interface TerminationStepsProps {
  steps: TerminationStep[];
  className?: string;
}

const TerminationSteps: React.FC<TerminationStepsProps> = ({ steps, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
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
        </div>
      ))}
    </div>
  );
};

export default TerminationSteps;
