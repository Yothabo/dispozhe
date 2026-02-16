import React from 'react'
import { FaFile, FaImage, FaFilePdf, FaFileWord, FaDownload } from 'react-icons/fa'
import { Message, FileMessage } from '../ActiveChat'

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

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} message-bubble`}>
      <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
        {message.file ? (
          // File message
          <div 
            onClick={() => onViewFile(message)}
            className={`
              rounded-2xl p-3 cursor-pointer transition-all hover:opacity-90
              ${isMe 
                ? 'bg-sky/10 text-white border border-sky/20' 
                : 'bg-white/5 text-white rounded-bl-none border border-white/10'
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
          // Text message - simple styling, accent only for status
          <div 
            className={`
              rounded-2xl px-4 py-2 break-words
              ${isMe 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'bg-white/5 text-white border border-white/10'
              }
            `}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        )}
        
        {/* Timestamp and status - accent color only for ticks */}
        <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-grey/50">{formatTime(message.timestamp)}</span>
          {isMe && (
            <span className="text-sky">
              {message.status === 'sending' && '⏳'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
