import React, { useState, useEffect } from 'react'
import { FaLink, FaCopy, FaShare, FaQrcode, FaCheck, FaSpinner, FaTrash, FaKey, FaArrowLeft } from 'react-icons/fa'
import QRCode from 'react-qr-code'
import { preventChatReload } from '../../utils/preventReload'

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
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [codeExpired, setCodeExpired] = useState(false)
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyCode = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedCode(true);
        if (onCopyCode) onCopyCode();
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Driflly - Private Chat Invitation',
          text: 'Join me for a private, encrypted conversation that vanishes.',
          url: link,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

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

  const handleCodeModalOpen = () => {
    setTimeout(() => {
      setCodeExpired(true);
    }, 30000);
    setShowCodeModal(true);
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

  return (
    <div className="fixed inset-0 flex flex-col bg-navy">
      <div className="flex-1 overflow-y-auto px-4 pt-24 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-start min-h-full">
            
            {/* HOW TO CONNECT - First */}
            <div className="w-full max-w-md mb-6">
              <h3 className="text-white/50 text-xs font-bold tracking-wide mb-4">HOW TO CONNECT</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky/20">
                    <span className="text-sky text-xs font-black">1</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold mb-0.5">Share the link</h4>
                    <p className="text-grey text-xs font-light leading-relaxed">Send the link above. Opens directly in browser.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky/20">
                    <span className="text-sky text-xs font-black">2</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold mb-0.5">Scan QR code</h4>
                    <p className="text-grey text-xs font-light leading-relaxed">Quick connect for mobile users.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky/20">
                    <span className="text-sky text-xs font-black">3</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold mb-0.5">Enter 6-digit code</h4>
                    <p className="text-grey text-xs font-light leading-relaxed">Alternative for voice/phone sharing.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shareable Link Card - Second */}
            <div className="glass rounded-2xl p-6 mb-6 w-full max-w-md">
              <div className="flex items-center gap-2 mb-4">
                <FaLink className="text-sky w-4 h-4" />
                <span className="text-white text-xs font-medium tracking-wide">Shareable link</span>
                <span className="text-[10px] text-grey/50 ml-auto font-medium tracking-wide">PRIMARY</span>
              </div>
              <div className="bg-navy/50 rounded-xl p-3 mb-4 font-mono text-xs text-grey-light break-all border border-white/5 font-light">
                {link}
              </div>
              
              {/* Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleCopy}
                  className="flex flex-col items-center justify-center gap-1.5 bg-white/5 text-white px-2 py-3 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  {copied ? <FaCheck className="w-4 h-4 text-sky" /> : <FaCopy className="w-4 h-4 text-grey-light group-hover:text-white transition-colors" />}
                  <span className="text-[10px] font-medium tracking-wide text-grey-light group-hover:text-white transition-colors">{copied ? 'Copied' : 'Copy'}</span>
                </button>
                
                {navigator.share && (
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center gap-1.5 bg-white/5 text-white px-2 py-3 rounded-lg hover:bg-white/10 transition-colors group"
                  >
                    <FaShare className="w-4 h-4 text-grey-light group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-medium tracking-wide text-grey-light group-hover:text-white transition-colors">Share</span>
                  </button>
                )}
                
                <button
                  onClick={() => setShowQRModal(true)}
                  className="flex flex-col items-center justify-center gap-1.5 bg-white/5 text-white px-2 py-3 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <FaQrcode className="w-4 h-4 text-grey-light group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-medium tracking-wide text-grey-light group-hover:text-white transition-colors">QR</span>
                </button>
                
                <button
                  onClick={handleCodeModalOpen}
                  className="flex flex-col items-center justify-center gap-1.5 bg-white/5 text-white px-2 py-3 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <FaKey className="w-4 h-4 text-grey-light group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-medium tracking-wide text-grey-light group-hover:text-white transition-colors">Code</span>
                </button>
              </div>
            </div>

            {/* Note - Third */}
            <div className="w-full max-w-md">
              <p className="text-grey/50 text-xs font-light leading-relaxed">
                <span className="text-sky font-bold">Note:</span> All methods are one-time use. 
                The link expires immediately after someone joins.
              </p>
            </div>

            {/* Waiting Indicator */}
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

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white text-lg font-bold mb-4">Scan QR Code</h3>
            <div className="flex justify-center mb-4">
              <QRCode value={link} size={200} bgColor="transparent" fgColor="#64ffda" />
            </div>
            <p className="text-center text-grey text-sm font-light mb-4">Scan with phone camera to join the chat</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-3 bg-white/5 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-colors action-button"
              >
                Cancel
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-3 bg-sky/10 text-sky rounded-lg text-sm font-bold hover:bg-sky/20 transition-colors flex items-center justify-center gap-2 border border-sky/20 action-button"
              >
                <FaCopy className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Modal */}
      {showCodeModal && code && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
          <div className="glass rounded-2xl p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky to-sky-dark flex items-center justify-center mx-auto mb-4">
                <FaKey className="text-navy text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Access code</h3>
              <p className="text-grey text-sm font-light">
                Share this 6-digit code with the other person
              </p>
            </div>

            <div className="flex justify-between gap-2 mb-6">
              {code.split('').map((digit, i) => (
                <div
                  key={i}
                  className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center"
                >
                  <span className="text-white text-2xl font-bold">{digit}</span>
                </div>
              ))}
            </div>

            {codeExpired && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                <p className="text-yellow-400 text-xs font-medium text-center">This code will expire in 30 seconds for security</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setCodeExpired(false);
                }}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-center gap-2 action-button"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleCopyCode}
                disabled={codeExpired}
                className="flex-1 px-4 py-3 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 action-button"
              >
                <FaCopy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Termination Modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
          <div className="glass rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <FaTrash className="w-6 h-6 text-red-400" />
            </div>
            
            <h3 className="text-white text-xl font-bold text-center mb-4">
              Terminate Session
            </h3>
            
            <div className="space-y-3 mb-6">
              {[
                'Destroy invitation link',
                'Wipe encryption keys from memory',
                'Clear session data from server',
                'Close encrypted tunnel',
                'Purge all traces from database'
              ].map((label, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {itemStates[index].status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-grey/30"></div>}
                    {itemStates[index].status === 'loading' && <FaSpinner className="w-3 h-3 text-sky animate-spin" />}
                    {itemStates[index].status === 'completed' && <FaCheck className="w-3 h-3 text-sky" />}
                  </div>
                  <span className={`text-sm ${itemStates[index].status === 'completed' ? 'text-sky font-bold' : 'text-grey font-light'}`}>{label}</span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTerminateModal(false);
                  setItemStates([
                    { id: 1, status: 'pending' },
                    { id: 2, status: 'pending' },
                    { id: 3, status: 'pending' },
                    { id: 4, status: 'pending' },
                    { id: 5, status: 'pending' }
                  ]);
                }}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminateClick}
                className="flex-1 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 hover:border-red-500/50"
              >
                Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingScreen;
