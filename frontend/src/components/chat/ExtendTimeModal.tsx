import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

interface ExtendTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtend: (minutes: number) => void;
}

const ExtendTimeModal: React.FC<ExtendTimeModalProps> = ({ isOpen, onClose, onExtend }) => {
  const [customMinutes, setCustomMinutes] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const presets = [
    { minutes: 5, display: '00:05', label: '5 min' },
    { minutes: 15, display: '00:15', label: '15 min' },
    { minutes: 30, display: '00:30', label: '30 min' },
    { minutes: 60, display: '01:00', label: '1 hour' }
  ];

  const handlePresetSelect = (minutes: number) => {
    setSelectedPreset(minutes);
    onExtend(minutes);
  };

  const handleCustomSelect = () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      alert('Please enter a valid duration between 1 and 1440 minutes');
      return;
    }
    setSelectedPreset(minutes);
    onExtend(minutes);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSelect();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onClose}
            className="p-2 text-grey hover:text-white transition-colors"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">Add time</h2>
        </div>

        {/* Preset buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {presets.map((preset) => {
            const isActive = selectedPreset === preset.minutes;

            return (
              <button
                key={preset.minutes}
                onClick={() => handlePresetSelect(preset.minutes)}
                className={`
                  p-6 rounded-xl border-2 transition-all text-center
                  ${isActive
                    ? 'border-sky bg-sky/10'
                    : 'border-white/10 hover:border-sky/50 bg-white/5'
                  }
                `}
              >
                <div className="font-mono text-2xl font-bold mb-1">
                  {preset.display}
                </div>
                <div className={`text-xs ${isActive ? 'text-sky' : 'text-grey/60'}`}>
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
            className="flex-1 px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-grey/30 focus:outline-none focus:border-sky/50 text-lg"
          />
          <button
            onClick={handleCustomSelect}
            disabled={!customMinutes}
            className="px-6 py-4 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark transition-colors disabled:opacity-50 text-lg min-w-[100px]"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtendTimeModal;
