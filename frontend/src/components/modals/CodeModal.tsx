import React, { useState, useEffect } from 'react'
import { FaKey, FaCopy, FaArrowLeft } from 'react-icons/fa'

interface CodeModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
  onCopy: () => void
}

const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose, code, onCopy }) => {
  const [codeExpired, setCodeExpired] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCodeExpired(false);
      const timer = setTimeout(() => {
        setCodeExpired(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      onCopy();
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (!isOpen || !code) return null;

  return (
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
            onClick={onClose}
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
            {copiedCode ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;
