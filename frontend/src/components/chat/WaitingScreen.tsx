import React, { useState, useEffect } from 'react'
import { FaSpinner, FaTrash } from 'react-icons/fa'

import { preventChatReload } from '../../utils/preventReload'
import HowToConnect from './howto/HowToConnect'
import ShareableLinkCard from './cards/ShareableLinkCard'
import QRModal from '../modals/QRModal'
import CodeModal from '../modals/CodeModal'
import TerminateSessionModal from '../modals/TerminateSessionModal'
import TerminationSteps from './termination/TerminationSteps'

interface WaitingScreenProps {
  link: string
  duration: number
  sessionId: string
  code?: string
  onCopy: () => void
  onCopyCode?: () => void
  onTerminate: () => void
}

const WaitingScreen: React.FC<WaitingScreenProps> = ({
  link,
  duration,
  sessionId,
  code,
  onCopy,
  onCopyCode,
  onTerminate
}) => {
  const [showQRModal, setShowQRModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [showTerminateModal, setShowTerminateModal] = useState(false)
  const [isDestroyed, setIsDestroyed] = useState(false)
  const [itemStates, setItemStates] = useState([
    { id: 1, status: 'pending' },
    { id: 2, status: 'pending' },
    { id: 3, status: 'pending' },
    { id: 4, status: 'pending' },
    { id: 5, status: 'pending' }
  ])

  useEffect(() => {
    const cleanup = preventChatReload("This will terminate your chat session. Are you sure?");
    return cleanup;
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      setShowTerminateModal(true);
    };
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
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
            setIsDestroyed(true);
            setTimeout(() => {
              onTerminate();
            }, 1200);
          }
        }, 400);
      }, index * 300);
    });
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
      <div className="flex-1 overflow-y-auto px-4 pt-24 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-start min-h-full">
            
            {/* Centered container for the two columns */}
            <div className="w-full max-w-4xl mx-auto">
              {/* Two-column layout - 1fr 1fr on all viewports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                
                {/* Left Column - How to Connect */}
                <HowToConnect />

                {/* Right Column - Shareable Link Card */}
                <ShareableLinkCard
                  link={link}
                  code={code}
                  onCopy={onCopy}
                  onCopyCode={onCopyCode}
                  onOpenQR={() => setShowQRModal(true)}
                  onOpenCode={() => setShowCodeModal(true)}
                />
              </div>
            </div>

            {/* Waiting Indicator - centered below both columns */}
            <div className="flex items-center gap-2 mt-12 text-grey/70">
              <FaSpinner className="w-3 h-3 text-sky animate-spin" />
              <span className="text-xs font-light tracking-wide">Waiting for someone to join...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminate Button */}
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

      {/* Modals */}
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
