import React from 'react';

interface ConnectionBannerProps {
  isConnected: boolean;
  otherUserLeft: boolean;
  timeUp: boolean;
  headerHeight: number;
}

const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
  isConnected,
  otherUserLeft,
  timeUp,
  headerHeight
}) => {
  if (isConnected || otherUserLeft || timeUp) return null;

  return (
    <div style={{
      position: 'absolute',
      top: headerHeight,
      left: 0,
      right: 0,
      height: 41,
      zIndex: 40,
      backgroundColor: 'rgba(250, 204, 21, 0.1)',
      borderBottom: '1px solid rgba(250, 204, 21, 0.2)',
      padding: '0.5rem 1rem'
    }}>
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-yellow-400 text-xs">Establishing secure connection...</span>
      </div>
    </div>
  );
};

export default ConnectionBanner;
