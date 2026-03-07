import React from 'react';
import { FaSpinner, FaClock } from 'react-icons/fa';

interface ReconnectingBannerProps {
  attempt: number;
  timeSinceDisconnect: string;
}

const ReconnectingBanner: React.FC<ReconnectingBannerProps> = ({ 
  attempt, 
  timeSinceDisconnect 
}) => {
  return (
    <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaSpinner className="w-4 h-4 text-blue-400 animate-spin" />
          <div className="flex flex-col">
            <span className="text-blue-400 text-sm font-medium">
              Reconnecting... {attempt > 0 && `(Attempt ${attempt})`}
            </span>
            <span className="text-blue-400/60 text-xs flex items-center gap-1">
              <FaClock className="w-3 h-3" />
              Disconnected for {timeSinceDisconnect}
            </span>
          </div>
        </div>
        <div className="text-blue-400/60 text-xs">
          Don&apos;t close the tab - you&apos;ll reconnect automatically
        </div>
      </div>
    </div>
  );
};

export default ReconnectingBanner;
