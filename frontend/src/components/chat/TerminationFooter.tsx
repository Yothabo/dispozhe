import React from 'react';
import TerminationActions from './termination/TerminationActions';

interface TerminationFooterProps {
  onTerminate: () => void;
  style: React.CSSProperties;
}

const TerminationFooter: React.FC<TerminationFooterProps> = ({ onTerminate, style }) => {
  return (
    <div style={style}>
      <TerminationActions onTerminate={onTerminate} />
    </div>
  );
};

export default TerminationFooter;
