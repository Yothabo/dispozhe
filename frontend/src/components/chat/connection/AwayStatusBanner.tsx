import React from 'react';
import { FaUserClock } from 'react-icons/fa';

interface AwayStatusBannerProps {
  isAway: boolean;
  message?: string;
  onDismiss?: () => void;
}

const AwayStatusBanner: React.FC<AwayStatusBannerProps> = ({ 
  isAway, 
  message = "Other user is away. Session will expire in 2 minutes if they don't return.",
  onDismiss 
}) => {
  if (!isAway) return null;

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-400">
          <FaUserClock className="w-4 h-4 animate-pulse" />
          <span className="text-sm">{message}</span>
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="text-yellow-400/70 hover:text-yellow-400 text-sm font-medium"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default AwayStatusBanner;
