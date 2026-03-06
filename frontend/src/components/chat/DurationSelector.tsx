import React, { useState } from 'react';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';

interface DurationSelectorProps {
  onSelect: (minutes: number) => void;
  onClose: () => void;
  isCreating?: boolean;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({ onSelect, onClose, isCreating = false }) => {
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const presets = [
    { minutes: 5, display: '00:05:00', label: '5 minutes' },
    { minutes: 15, display: '00:15:00', label: '15 minutes' },
    { minutes: 30, display: '00:30:00', label: '30 minutes' },
    { minutes: 60, display: '01:00:00', label: '1 hour' }
  ];

  const handlePresetSelect = async (minutes: number) => {
    setSelectedPreset(minutes);
    onSelect(minutes);
  };

  const handleCustomSelect = async () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      alert('Please enter a valid duration between 1 and 1440 minutes');
      return;
    }

    setSelectedPreset(minutes);
    onSelect(minutes);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSelect();
    }
  };

  const renderTimeDisplay = (display: string) => {
    return (
      <div className="font-mono text-2xl font-bold mb-1">
        {display}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onClose}
            className="p-2 text-grey hover:text-white transition-colors"
            aria-label="Go back"
            disabled={isCreating}
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">Choose duration</h2>
        </div>

        {/* Instruction */}
        <p className="text-grey text-sm mb-6 font-light">
          Select how much time your chat should last
        </p>

        {/* Preset buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {presets.map((preset) => {
            const isActive = selectedPreset === preset.minutes && isCreating;

            return (
              <button
                key={preset.minutes}
                onClick={() => handlePresetSelect(preset.minutes)}
                disabled={isCreating}
                className={`
                  p-6 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center
                  ${isActive
                    ? 'border-sky bg-sky/10'
                    : 'border-white/10 hover:border-sky/50 bg-white/5'
                  }
                  ${isCreating ? 'cursor-wait opacity-80' : 'hover:bg-white/10'}
                `}
              >
                {renderTimeDisplay(preset.display)}
                <div className={`text-xs ${
                  isActive ? 'text-grey' : 'text-grey/40'
                }`}>
                  {preset.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom input divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-navy text-grey/30">or custom</span>
          </div>
        </div>

        {/* Custom input */}
        <div className="flex gap-3">
          <input
            type="number"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter minutes"
            min="1"
            max="1440"
            disabled={isCreating}
            className="flex-1 px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-grey/30 focus:outline-none focus:border-sky/50 disabled:opacity-50 text-lg"
          />
          <button
            onClick={handleCustomSelect}
            disabled={!customMinutes || isCreating}
            className="px-6 py-4 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark transition-colors disabled:opacity-50 text-lg min-w-[100px] flex items-center justify-center"
          >
            {isCreating ? (
              <FaSpinner className="w-5 h-5 animate-spin" />
            ) : (
              'Go'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DurationSelector;
