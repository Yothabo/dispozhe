import React, { useState } from 'react';
import { FaClock, FaCog, FaPlus, FaTrash } from 'react-icons/fa';
import ExtendTimeModal from '../ExtendTimeModal';

interface ChatHeaderProps {
  isConnected: boolean;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  onTerminate: () => void;
  onExtend: (minutes: number) => void;
  isTerminated?: boolean;
  canExtend?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isConnected,
  timeLeft,
  formatTime,
  onTerminate,
  onExtend,
  isTerminated = false,
  canExtend = true
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);

  const getTimerColor = () => {
    if (timeLeft < 60) return 'text-red-400';
    if (timeLeft < 180) return 'text-yellow-400';
    return 'text-sky';
  };

  const handleExtendClick = (minutes: number) => {
    onExtend(minutes);
    setShowExtendModal(false);
    setShowMenu(false);
  };

  return (
    <>
      <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="text-white text-sm font-medium">Driflly</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            
            {/* Timer display */}
            <div className="flex items-center gap-1.5 text-grey text-xs">
              <FaClock className={`w-3 h-3 ${getTimerColor()}`} />
              <span className={`font-mono ${getTimerColor()}`}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Menu button - matching attachment button style */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={isTerminated}
              className="p-3 text-grey hover:text-white disabled:opacity-50 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 hover:border-sky/30 flex items-center justify-center"
            >
              <FaCog className="w-5 h-5" />
            </button>

            {showMenu && !isTerminated && (
              <div className="absolute top-full right-0 mt-2 glass rounded-xl p-2 min-w-[200px] z-50 border border-white/10">
                {/* Add time option */}
                {canExtend && (
                  <button
                    onClick={() => {
                      setShowExtendModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                  >
                    <FaPlus className="w-3 h-3 text-sky" />
                    Add time
                  </button>
                )}
                
                {/* End chat option */}
                <button
                  onClick={() => {
                    onTerminate();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
                >
                  <FaTrash className="w-3 h-3" />
                  End chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extend Time Modal */}
      <ExtendTimeModal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        onExtend={handleExtendClick}
      />
    </>
  );
};

export default ChatHeader;
