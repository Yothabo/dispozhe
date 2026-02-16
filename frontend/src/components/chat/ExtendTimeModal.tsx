import React, { useState } from 'react';
import { FaClock, FaTimes } from 'react-icons/fa';

interface ExtendTimeModalProps {
  show: boolean;
  onExtend: (minutes: number) => void;
  onClose: () => void;
  canExtend?: boolean;
  maxMinutes?: number;
}

const ExtendTimeModal: React.FC<ExtendTimeModalProps> = ({ 
  show, 
  onExtend, 
  onClose,
  canExtend = true,
  maxMinutes = 5
}) => {
  const [customMinutes, setCustomMinutes] = useState('');

  if (!show) return null;

  const handleExtend = (minutes: number) => {
    onExtend(minutes);
    onClose();
  };

  const handleCustomExtend = () => {
    const mins = parseInt(customMinutes);
    if (mins > 0 && mins <= maxMinutes) {
      onExtend(mins);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Extend Chat Time</h3>
          <button onClick={onClose} className="text-grey hover:text-white">
            <FaTimes />
          </button>
        </div>

        {!canExtend ? (
          <div className="text-center py-4">
            <p className="text-grey mb-2">Maximum extension reached (5 minutes total)</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-sky text-navy rounded-lg font-medium hover:bg-sky-dark"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-grey mb-4 text-sm">
              Add more time to your chat. Maximum total duration is 5 minutes.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleExtend(1)}
                className="p-3 bg-white/5 rounded-xl hover:bg-sky/10 transition-colors border border-white/10 hover:border-sky/20"
              >
                <div className="font-mono text-xl font-bold text-white mb-1">+1 min</div>
              </button>
              <button
                onClick={() => handleExtend(2)}
                className="p-3 bg-white/5 rounded-xl hover:bg-sky/10 transition-colors border border-white/10 hover:border-sky/20"
              >
                <div className="font-mono text-xl font-bold text-white mb-1">+2 min</div>
              </button>
              <button
                onClick={() => handleExtend(3)}
                className="p-3 bg-white/5 rounded-xl hover:bg-sky/10 transition-colors border border-white/10 hover:border-sky/20"
              >
                <div className="font-mono text-xl font-bold text-white mb-1">+3 min</div>
              </button>
              <button
                onClick={() => handleExtend(4)}
                className="p-3 bg-white/5 rounded-xl hover:bg-sky/10 transition-colors border border-white/10 hover:border-sky/20"
              >
                <div className="font-mono text-xl font-bold text-white mb-1">+4 min</div>
              </button>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-navy text-grey">or custom</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder={`Max ${maxMinutes} min`}
                min="1"
                max={maxMinutes}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-grey/50 focus:outline-none focus:border-sky/50"
              />
              <button
                onClick={handleCustomExtend}
                disabled={!customMinutes || parseInt(customMinutes) < 1 || parseInt(customMinutes) > maxMinutes}
                className="px-4 py-2 bg-sky text-navy rounded-lg font-medium hover:bg-sky-dark disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExtendTimeModal;
