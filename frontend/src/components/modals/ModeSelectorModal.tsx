import React, { useEffect, useState } from 'react';
import { FaTimes, FaUserFriends, FaUsers, FaChalkboardTeacher, FaBroadcastTower, FaFileDownload, FaCommentSlash, FaLock } from 'react-icons/fa';

interface ModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: string) => void;
}

const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({ isOpen, onClose, onSelectMode }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsClosing(false), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isClosing]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleModeSelect = (mode: string) => {
    if (mode === 'duo') {
      onSelectMode(mode);
      handleClose();
    }
  };

  if (!shouldRender) return null;

  const modes = [
    { id: 'duo', name: 'Duo', icon: FaUserFriends, description: 'Private two-person ephemeral chats', available: true },
    { id: 'group', name: 'Group', icon: FaUsers, description: 'Small multi-participant sessions', available: false },
    { id: 'liveboard', name: 'Live Board', icon: FaChalkboardTeacher, description: 'Classroom and meeting engagement', available: false },
    { id: 'broadcast', name: 'Broadcast', icon: FaBroadcastTower, description: 'One-to-many ephemeral announcements', available: false },
    { id: 'drop', name: 'Drop', icon: FaFileDownload, description: 'Ephemeral file and text transfer', available: false },
    { id: 'whisper', name: 'Whisper', icon: FaCommentSlash, description: 'Messages that disappear after reading', available: false }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-navy/80 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Modal - attached to bottom on all screens */}
      <div
        className={`relative bg-navy-light border-t border-white/10 rounded-t-2xl w-full sm:w-3/4 lg:w-2/3 xl:w-1/2 sm:max-w-3xl shadow-2xl transition-all duration-300 ease-out flex flex-col h-[55vh] sm:h-[60vh] lg:h-[65vh] max-h-[700px] ${
          isClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">Choose a mode</h3>
          <button
            onClick={handleClose}
            className="p-2 text-grey hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Close modal"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <p className="text-sm text-grey mb-4">
            Select how you want to communicate. Each mode is ephemeral and encrypted by design.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  disabled={!mode.available}
                  className={`glass rounded-xl p-4 text-left transition-all duration-200 flex items-start gap-3 border ${
                    mode.available 
                      ? 'border-sky/20 hover:border-sky/50 hover:bg-sky/5 cursor-pointer' 
                      : 'border-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    mode.available ? 'bg-sky/10' : 'bg-white/5'
                  }`}>
                    <Icon className={`text-xl ${mode.available ? 'text-sky' : 'text-grey'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold ${mode.available ? 'text-white' : 'text-grey'}`}>
                        {mode.name}
                      </h4>
                      {!mode.available && (
                        <span className="text-[10px] text-grey/50 px-2 py-0.5 bg-white/5 rounded-full">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-grey/70 mt-1">{mode.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-3 bg-sky/5 rounded-lg border border-sky/10">
            <div className="flex items-center gap-2">
              <FaLock className="text-sky text-xs" />
              <p className="text-xs text-grey">
                All modes are end-to-end encrypted. No data stored. No identity required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelectorModal;
