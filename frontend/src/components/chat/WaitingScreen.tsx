import React, { useState, useEffect } from 'react';
import { FaSpinner, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { preventChatReload } from '../../utils/preventReload';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';
import HowToConnect from './howto/HowToConnect';
import ShareableLinkCard from './cards/ShareableLinkCard';
import QRModal from '../modals/QRModal';
import CodeModal from '../modals/CodeModal';
import TerminateSessionModal from '../modals/TerminateSessionModal';

interface WaitingScreenProps {
  link: string;
  _duration: number;
  _sessionId: string;
  code?: string;
  onCopy: () => void;
  onCopyCode?: () => void;
  onTerminate: () => void;
}

const WaitingScreen: React.FC<WaitingScreenProps> = ({
  link,
  code,
  onCopy,
  onCopyCode,
  onTerminate
}) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [itemStates, setItemStates] = useState([
    { id: 1, status: 'pending' },
    { id: 2, status: 'pending' },
    { id: 3, status: 'pending' },
    { id: 4, status: 'pending' },
    { id: 5, status: 'pending' }
  ]);

  useNavigationGuard({
    isActive: true,
    onBack: () => {
      setShowTerminateModal(true);
    }
  });

  useEffect(() => {
    const cleanup = preventChatReload("This will terminate your chat session. Are you sure?");
    return cleanup;
  }, []);

  const handleTerminateClick = () => {
    const items = [...itemStates];
    items.forEach((item, index) => {
      setTimeout(() => {
        setItemStates(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'loading' } : i)
        );
        setTimeout(() => {
          setItemStates(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i)
          );
          if (index === items.length - 1) {
            setTimeout(() => {
              onTerminate();
            }, 1200);
          }
        }, 400);
      }, index * 300);
    });
  };

  const handleGoBack = () => {
    setShowTerminateModal(true);
  };

  if (!link) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-sky animate-spin mx-auto mb-4" />
          <p className="text-grey text-sm font-light">generating secure link...</p>
        </div>
      </div>
    );
  }

  const terminationStepItems = itemStates.map((state, index) => ({
    id: index + 1,
    label: [
      "Destroy invitation link",
      "Wipe encryption keys from memory",
      "Clear session data from server",
      "Close encrypted tunnel",
      "Purge all traces from database"
    ][index],
    status: state.status as "pending" | "loading" | "completed"
  }));

  return (
    <div className="fixed inset-0 flex flex-col bg-navy">
      <div className="absolute top-4 left-4 z-10 lg:hidden">
        <button
          onClick={handleGoBack}
          className="p-2 text-grey hover:text-white transition-colors"
          aria-label="Go back"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-24 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-start min-h-full">
            <div className="w-full max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                <HowToConnect />
                <ShareableLinkCard
                  link={link}
                  code={code}
                  onCopy={onCopy}
                  _onCopyCode={onCopyCode}
                  onOpenQR={() => setShowQRModal(true)}
                  onOpenCode={() => setShowCodeModal(true)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-12 text-grey/70">
              <FaSpinner className="w-3 h-3 text-sky animate-spin" />
              <span className="text-xs font-light tracking-wide">Waiting for someone to join...</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowTerminateModal(true)}
            className="w-full py-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold tracking-wide border border-red-500/20 hover:border-red-500/50 action-button"
          >
            <FaTrash className="inline mr-2 w-3 h-3" />
            TERMINATE SESSION
          </button>
        </div>
      </div>

      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        link={link}
        onCopy={onCopy}
      />

      <CodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        code={code || ''}
        onCopy={onCopyCode || onCopy}
      />

      <TerminateSessionModal
        isOpen={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        onConfirm={handleTerminateClick}
        steps={terminationStepItems}
      />
    </div>
  );
};

export default WaitingScreen;
