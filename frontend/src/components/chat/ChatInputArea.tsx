import React from 'react';
import { FaPaperclip, FaPaperPlane, FaTrash } from 'react-icons/fa';

interface ChatInputAreaProps {
  inputText: string;
  isConnected: boolean;
  isSendingFile: boolean;
  isTerminating: boolean;
  otherUserLeft: boolean;
  timeUp: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onAttachmentClick: () => void;
  onTerminateClick: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  keyboardHeight: number;
  inputHeight: number;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  inputText,
  isConnected,
  isSendingFile,
  isTerminating,
  otherUserLeft,
  timeUp,
  onInputChange,
  onSend,
  onAttachmentClick,
  onTerminateClick,
  inputRef,
  keyboardHeight,
  inputHeight
}) => {
  if (otherUserLeft || timeUp) {
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 73,
          zIndex: 40,
          backgroundColor: '#0A192F',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 w-full">
          <button
            onClick={onTerminateClick}
            className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors text-sm font-medium border border-red-500/20 hover:border-red-500/50 flex items-center justify-center gap-2"
          >
            <FaTrash className="w-4 h-4" />
            <span>Terminate session</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: inputHeight,
        zIndex: 40,
        backgroundColor: '#0A192F',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAttachmentClick}
            disabled={!isConnected || isSendingFile}
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
            disabled={!isConnected || isSendingFile}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-grey/50 focus:outline-none focus:border-sky/50 disabled:opacity-50"
          />

          <button
            type="button"
            onClick={onSend}
            disabled={!inputText.trim() || !isConnected || isSendingFile}
            className="p-2 bg-sky text-navy rounded-xl hover:bg-sky-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;
