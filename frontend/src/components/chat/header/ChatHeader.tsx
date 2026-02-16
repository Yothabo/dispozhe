import React from 'react'
import { FaClock, FaTrash } from 'react-icons/fa'

interface ChatHeaderProps {
  isConnected: boolean
  timeLeft: number
  formatTime: (seconds: number) => string
  onTerminate: () => void
  onExtend: () => void
  isTerminated?: boolean
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isConnected,
  timeLeft,
  formatTime,
  onTerminate,
  onExtend,
  isTerminated = false
}) => {
  return (
    <div className="bg-navy-light/30 backdrop-blur-sm border-b border-white/5 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            <span className="text-white text-sm font-medium">Chatlly</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <button
            onClick={onExtend}
            disabled={isTerminated}
            className="flex items-center gap-1.5 text-grey hover:text-white transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaClock className="w-3 h-3" />
            <span>{formatTime(timeLeft)}</span>
          </button>
        </div>

        {!isTerminated && (
          <button
            onClick={onTerminate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-xs font-medium border border-red-500/20 hover:border-red-500/50"
          >
            <FaTrash className="w-3 h-3" />
            <span>End chat</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default ChatHeader
