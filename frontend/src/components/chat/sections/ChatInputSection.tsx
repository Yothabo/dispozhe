import React from 'react';

interface ChatInputSectionProps {
  inputText: string;
  isConnected: boolean;
  encryptionReady: boolean;
  isSendingFile: boolean;
  isUploading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onAttachmentClick: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  keyboardHeight: number;
}

const ChatInputSection: React.FC<ChatInputSectionProps> = ({
  inputText,
  isConnected,
  encryptionReady,
  isSendingFile,
  isUploading,
  onInputChange,
  onSend,
  onAttachmentClick,
  inputRef,
  keyboardHeight,
}) => {
  return (
    <div
      className="bg-navy border-t border-white/10 flex-shrink-0"
      style={{ paddingBottom: keyboardHeight }}
    >
      <div className="max-w-4xl mx-auto px-4 h-[73px] flex items-center gap-2">
        <button
          onClick={onAttachmentClick}
          disabled={!isConnected || !encryptionReady || isSendingFile || isUploading}
          className="p-3 text-grey hover:text-white disabled:opacity-50 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 hover:border-sky/30"
          title="Attach file"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={onInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={!encryptionReady ? "Initializing encryption..." : isConnected ? "Type your message..." : "Connecting..."}
          disabled={!isConnected || !encryptionReady || isSendingFile || isUploading}
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-grey/50 focus:outline-none focus:border-sky/50 disabled:opacity-50 text-base"
        />

        <button
          onClick={onSend}
          disabled={!inputText.trim() || !isConnected || !encryptionReady || isSendingFile || isUploading}
          className="p-3 bg-sky text-navy rounded-xl hover:bg-sky-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInputSection;
