import React from 'react'
import { FaCopy } from 'react-icons/fa'
import QRCode from 'react-qr-code'

interface QRModalProps {
  isOpen: boolean
  onClose: () => void
  link: string
  onCopy: () => void
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, link, onCopy }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-white text-lg font-bold mb-4">Scan QR Code</h3>
        <div className="flex justify-center mb-4">
          <QRCode value={link} size={200} bgColor="transparent" fgColor="#64ffda" />
        </div>
        <p className="text-center text-grey text-sm font-light mb-4">Scan with phone camera to join the chat</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 bg-white/5 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-colors action-button"
          >
            Cancel
          </button>
          <button
            onClick={onCopy}
            className="px-4 py-3 bg-sky/10 text-sky rounded-lg text-sm font-bold hover:bg-sky/20 transition-colors flex items-center justify-center gap-2 border border-sky/20 action-button"
          >
            <FaCopy className="w-4 h-4" />
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRModal;
