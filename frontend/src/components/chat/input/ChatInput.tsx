import React, { ChangeEvent, useState, useRef, useEffect } from 'react'
import { FaPaperPlane, FaPaperclip, FaSmile } from 'react-icons/fa'
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react'

interface ChatInputProps {
  inputText: string
  isConnected: boolean
  isSendingFile: boolean
  keyboardHeight: number
  onTyping: (e: ChangeEvent<HTMLInputElement>) => void
  onSend: () => void
  onAttachmentClick: () => void
  inputRef: React.RefObject<HTMLInputElement>
  disabled: boolean
  placeholder: string
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  isConnected,
  isSendingFile,
  keyboardHeight,
  onTyping,
  onSend,
  onAttachmentClick,
  inputRef,
  disabled,
  placeholder
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const handleEmojiClick = (emojiData: any) => {
    const newText = inputText + emojiData.emoji;
    // Create a synthetic event to pass to onTyping
    const event = {
      target: { value: newText }
    } as ChangeEvent<HTMLInputElement>;
    onTyping(event);
    // Keep picker open after selecting emoji
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      className="bg-navy border-t border-white/5"
      style={{ marginBottom: keyboardHeight }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAttachmentClick}
            disabled={disabled || isSendingFile}
            className="p-2 text-grey hover:text-white disabled:opacity-50 relative"
            title="Attach file"
          >
            <FaPaperclip className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled || isSendingFile}
            className="p-2 text-grey hover:text-white disabled:opacity-50 relative"
            title="Add emoji"
          >
            <FaSmile className="w-5 h-5" />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={onTyping}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSendingFile}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-grey/50 focus:outline-none focus:border-sky/50 disabled:opacity-50"
          />
          
          <button
            type="button"
            onClick={onSend}
            disabled={!inputText.trim() || disabled || isSendingFile}
            className="p-2 bg-sky text-navy rounded-xl hover:bg-sky-dark disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <FaPaperPlane className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="absolute bottom-full mb-2 left-0 z-50"
            style={{ 
              maxWidth: '350px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              autoFocusSearch={false}
              theme={Theme.DARK}
              searchPlaceholder="Search emojis..."
              width="100%"
              height={400}
              previewConfig={{
                showPreview: false
              }}
              skinTonesDisabled={true}
              searchDisabled={false}
              emojiStyle={EmojiStyle.NATIVE}
              lazyLoadEmojis={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInput
