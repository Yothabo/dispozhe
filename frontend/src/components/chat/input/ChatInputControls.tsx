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
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onAttachmentClick}
        disabled={isDisabled}
        className="p-2 text-grey hover:text-white disabled:opacity-50"
      >
        <FaPaperclip className="w-5 h-5" />
      </button>

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
        placeholder={isConnected ? "Type your message..." : "Connecting..."}
        disabled={isDisabled}
        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-grey/50 focus:outline-none focus:border-sky/50 disabled:opacity-50"
      />

      <button
        type="button"
        onClick={onSend}
        disabled={!inputText.trim() || isDisabled}
        className="p-2 bg-sky text-navy rounded-xl hover:bg-sky-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaPaperPlane className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ChatInputControls;
