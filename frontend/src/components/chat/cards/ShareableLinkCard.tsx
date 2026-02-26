import React, { useState } from 'react'
import { FaLink, FaCopy, FaShare, FaQrcode, FaKey, FaCheck } from 'react-icons/fa'

interface ShareableLinkCardProps {
  link: string
  code?: string
  onCopy: () => void
  onCopyCode?: () => void
  onOpenQR: () => void
  onOpenCode: () => void
}

const ShareableLinkCard: React.FC<ShareableLinkCardProps> = ({
  link,
  code,
  onCopy,
  onCopyCode,
  onOpenQR,
  onOpenCode
}) => {
  const [copied, setCopied] = useState(false)

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

  return (
    <div className="w-full">
      <div className="glass rounded-2xl p-6">
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
            onClick={onOpenQR}
            className="flex flex-col items-center justify-center gap-1.5 bg-white/5 text-white px-2 py-3 rounded-lg hover:bg-white/10 transition-colors group"
          >
            <FaQrcode className="w-4 h-4 text-grey-light group-hover:text-white transition-colors" />
            <span className="text-[10px] font-medium tracking-wide text-grey-light group-hover:text-white transition-colors">QR</span>
          </button>

          <button
            onClick={onOpenCode}
            className="flex flex-col items-center justify-center gap-1.5 bg-white/5 text-white px-2 py-3 rounded-lg hover:bg-white/10 transition-colors group"
          >
            <FaKey className="w-4 h-4 text-grey-light group-hover:text-white transition-colors" />
            <span className="text-[10px] font-medium tracking-wide text-grey-light group-hover:text-white transition-colors">Code</span>
          </button>
        </div>
      </div>

      {/* Note - below card */}
      <div className="mt-4">
        <p className="text-grey/50 text-xs font-light leading-relaxed">
          <span className="text-sky font-bold">Note:</span> All methods are one-time use.
          The link expires immediately after someone joins.
        </p>
      </div>
    </div>
  );
};

export default ShareableLinkCard;
