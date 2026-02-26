import React from 'react';
import ConnectionBanner from './connection/ConnectionBanner';

interface ConnectionStatusProps {
  isConnected: boolean;
  otherUserLeft: boolean;
  timeUp: boolean;
  headerHeight: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  otherUserLeft,
  timeUp,
  headerHeight
}) => {
  return (
    <ConnectionBanner
      isConnected={isConnected}
      otherUserLeft={otherUserLeft}
      timeUp={timeUp}
      headerHeight={headerHeight}
    />
  );
};

export default ConnectionStatus;
