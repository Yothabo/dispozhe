import React from 'react';

interface TerminationStepItemProps {
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

const TerminationStepItem: React.FC<TerminationStepItemProps> = ({ label, status }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        {status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-grey/50"></div>}
        {status === 'loading' && <div className="w-3 h-3 border-2 border-sky border-t-transparent rounded-full animate-spin"></div>}
        {status === 'completed' && <span className="text-sky text-xs">✓</span>}
      </div>
      <span className={`text-xs ${status === 'completed' ? 'text-sky' : 'text-grey'}`}>
        {label}
      </span>
      {status === 'completed' && (
        <span className="text-[10px] text-sky/70 ml-auto">Destroyed</span>
      )}
    </div>
  );
};

export default TerminationStepItem;
