import React, { useState } from 'react';
import { FaArrowLeft, FaSpinner, FaBolt } from 'react-icons/fa';

interface DurationSelectorProps {
  onSelect: (minutes: number) => void;
  onClose: () => void;
  isCreating?: boolean;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({ onSelect, onClose, isCreating = false }) => {
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const presets = [
    { minutes: 5, display: '00:05', label: '5 min', description: 'Quick chat' },
    { minutes: 15, display: '00:15', label: '15 min', description: 'Brief meeting' },
    { minutes: 30, display: '00:30', label: '30 min', description: 'Standard' },
    { minutes: 60, display: '01:00', label: '1 hour', description: 'Extended' }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 max-w-2xl w-full">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onClose}
            className="p-2 text-grey hover:text-white transition-colors"
            aria-label="Go back"
            disabled={isCreating}
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <FaBolt className="w-5 h-5 text-sky" />
            <h2 className="text-2xl font-bold text-white">Choose duration</h2>
          </div>
          {isCreating && (
            <div className="ml-auto flex items-center gap-2 text-sky">
              <FaSpinner className="w-4 h-4 animate-spin" />
              <span className="text-sm">Creating session...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {presets.map((preset) => {
            const isActive = selectedPreset === preset.minutes && isCreating;

            return (
              <button
                key={preset.minutes}
                onClick={() => handlePresetSelect(preset.minutes)}
                disabled={isCreating}
                className={`
                  p-4 rounded-xl border-2 transition-all text-center
                  ${isActive
                    ? 'border-sky bg-sky/10'
                    : 'border-white/10 hover:border-sky/50 bg-white/5'
                  }
                  ${isCreating ? 'cursor-wait opacity-80' : 'hover:bg-white/10'}
                  relative overflow-hidden
                `}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-sky/5 animate-pulse" />
                )}
                <div className="font-mono text-2xl font-bold mb-1">
                  {preset.display}
                </div>
                <div className={`text-xs ${isActive ? 'text-sky' : 'text-grey/60'}`}>
                  {preset.label}
                </div>
                <div className={`text-[10px] mt-1 ${isActive ? 'text-sky/60' : 'text-grey/40'}`}>
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-navy text-grey/30">or custom</span>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="number"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter minutes (1-1440)"
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
