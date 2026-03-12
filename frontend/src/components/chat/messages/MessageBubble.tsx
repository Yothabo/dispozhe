import React from 'react'
import { FaFile, FaImage, FaFilePdf, FaFileWord, FaDownload, FaCheck, FaCheckDouble } from 'react-icons/fa'

import { Message, FileMessage } from '../types'

interface MessageBubbleProps {
  message: Message
  onViewFile: (message: Message) => void
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onViewFile }) => {
  const isMe = message.sender === 'me'

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getFileIcon = (file: FileMessage) => {
    if (file.type.startsWith('image/')) {
      return <FaImage className="w-5 h-5" />
    }
    if (file.type === 'application/pdf') {
      return <FaFilePdf className="w-5 h-5" />
    }
    if (file.type.includes('word') || file.type.includes('document')) {
      return <FaFileWord className="w-5 h-5" />
    }
    return <FaFile className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleFileKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onViewFile(message);
    }
  };

  const getStatusIcon = () => {
    if (!isMe) return null;
    
    switch (message.status) {
      case 'sent':
        return <FaCheck className="w-3 h-3 text-grey/50" />;
      case 'delivered':
        return <FaCheckDouble className="w-3 h-3 text-grey/70" />;
      case 'read':
        return <FaCheckDouble className="w-3 h-3 text-sky" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} message-bubble`}>
      <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
        {message.file ? (
          <div
            onClick={() => onViewFile(message)}
            onKeyDown={handleFileKeyDown}
            role="button"
            tabIndex={0}
            className={`
              p-3 cursor-pointer transition-all hover:opacity-90
              ${isMe
                ? 'bg-sky/10 text-white border border-sky/20 rounded-2xl rounded-br-none'
                : 'bg-white/5 text-white border border-white/10 rounded-2xl rounded-bl-none'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${isMe ? 'bg-sky/20' : 'bg-white/10'}
              `}>
                {getFileIcon(message.file)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.file.name}</p>
                <p className="text-xs opacity-70">{formatFileSize(message.file.size)}</p>
              </div>
              <FaDownload className="w-4 h-4 opacity-70" />
            </div>
            {message.file.viewOnce && !message.file.viewed && message.sender === 'them' && (
              <p className="text-[10px] mt-2 text-center opacity-70">View once · Not viewed yet</p>
            )}
            {message.file.viewed && (
              <p className="text-[10px] mt-2 text-center opacity-70">Viewed</p>
            )}
          </div>
        ) : (
          <div
            className={`
              px-4 py-2 break-words
              ${isMe
                ? 'bg-sky/10 text-white border border-sky/20 rounded-2xl rounded-br-none'
                : 'bg-white/5 text-white border border-white/10 rounded-2xl rounded-bl-none'
              }
            `}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        )}

        <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-grey/50">{formatTime(message.timestamp)}</span>
          {isMe && (
            <span className="flex items-center">
              {getStatusIcon()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
