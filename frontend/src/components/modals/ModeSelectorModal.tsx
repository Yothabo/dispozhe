import React, { useState } from 'react';
import { FaTimes, FaUserFriends, FaUsers, FaChalkboardTeacher, FaBroadcastTower, FaFileDownload, FaCommentSlash } from 'react-icons/fa';

interface ModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: string) => void;
}

const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({ isOpen, onClose, onSelectMode }) => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  if (!isOpen) return null;

  const modes = [
    { id: 'duo', name: 'Duo', icon: FaUserFriends, description: 'Private two-person ephemeral chats', available: true },
    { id: 'group', name: 'Group', icon: FaUsers, description: 'Small multi-participant sessions', available: false },
    { id: 'liveboard', name: 'Live Board', icon: FaChalkboardTeacher, description: 'Classroom and meeting engagement', available: false },
    { id: 'broadcast', name: 'Broadcast', icon: FaBroadcastTower, description: 'One-to-many ephemeral announcements', available: false },
    { id: 'drop', name: 'Drop', icon: FaFileDownload, description: 'Ephemeral file and text transfer', available: false },
    { id: 'whisper', name: 'Whisper', icon: FaCommentSlash, description: 'Messages that disappear after reading', available: false }
  ];

  const handleModeSelect = (modeId: string) => {
    if (modeId === 'duo') {
      setSelectedMode(modeId);
      setTimeout(() => {
        onSelectMode(modeId);
        onClose();
      }, 200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Choose mode</h2>
          <button
            onClick={onClose}
            className="p-2 text-grey hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Mode options grid */}
        <div className="grid grid-cols-2 gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            
            return (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.id)}
                disabled={!mode.available}
                className={`
                  p-4 rounded-xl border-2 transition-all text-left w-full
                  ${mode.available 
                    ? isSelected
                      ? 'border-sky bg-sky/10'
                      : 'border-white/10 hover:border-sky/50 bg-white/5'
                    : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    mode.available ? 'bg-sky/10' : 'bg-white/5'
                  }`}>
                    <Icon className={`w-5 h-5 ${mode.available ? 'text-sky' : 'text-grey'}`} />
                  </div>
                  <span className="font-bold text-white text-sm">{mode.name}</span>
                </div>
                <div className="text-grey text-xs">{mode.description}</div>
                {!mode.available && (
                  <div className="mt-2 text-[10px] text-grey/50">Coming soon</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModeSelectorModal;
