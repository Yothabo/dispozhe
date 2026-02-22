import React from 'react';
import { FaPaperclip, FaPaperPlane } from 'react-icons/fa';

interface ChatInputControlsProps {
  inputText: string;
  isConnected: boolean;
  isSendingFile: boolean;
  isTerminating: boolean;
  otherUserLeft: boolean;
  timeUp: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onAttachmentClick: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ChatInputControls: React.FC<ChatInputControlsProps> = ({
  inputText,
  isConnected,
  isSendingFile,
  isTerminating,
  otherUserLeft,
  timeUp,
  onInputChange,
  onSend,
  onAttachmentClick,
  inputRef
}) => {
  const isDisabled = !isConnected || isSendingFile || isTerminating || otherUserLeft || timeUp;

  return (
    <div className="flex items-end gap-2 w-full">
      <button
        type="button"
        onClick={onAttachmentClick}
        disabled={isDisabled}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-navy-light hover:bg-sky/10 transition-colors flex items-center justify-center text-grey hover:text-sky disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Attach file"
      >
        <FaPaperclip className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0 relative">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={onInputChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={isConnected ? "Message" : "Connecting..."}
          disabled={isDisabled}
          className="w-full px-4 py-3 bg-navy-light border border-white/10 rounded-2xl text-white placeholder:text-grey/50 focus:outline-none focus:border-sky/50 focus:ring-1 focus:ring-sky/50 disabled:opacity-50 text-base"
        />
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={!inputText.trim() || isDisabled}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-sky text-navy hover:bg-sky-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        aria-label="Send message"
      >
        <FaPaperPlane className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ChatInputControls;
