import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DurationSelector from '../components/chat/DurationSelector'
import WaitingScreen from '../components/chat/WaitingScreen'
import api from '../services/api'

type ChatState = 'selecting' | 'waiting'

interface ChatPageProps {
  onExit: () => void
}

const ChatPage: React.FC<ChatPageProps> = ({ onExit }) => {
  const navigate = useNavigate()
  const [state, setState] = useState<ChatState>('selecting')
  const [duration, setDuration] = useState<number>(30)
  const [sessionId, setSessionId] = useState<string>('')
  const [chatLink, setChatLink] = useState<string>('')
  const [encryptionKey, setEncryptionKey] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const generateEncryptionKey = async (): Promise<string> => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
  }

  const handleDurationSelect = async (minutes: number) => {
    try {
      setError(null)
      
      const key = await generateEncryptionKey()
      setEncryptionKey(key)
      
      const response = await api.createSession(minutes)
      
      setDuration(minutes)
      setSessionId(response.session_id)
      if (response.code) {
        setCode(response.code)
        sessionStorage.setItem(`chatlly_code_${response.session_id}`, response.code)
      }
      
      const fullLink = `${window.location.origin}/c/${response.session_id}#${key}`
      setChatLink(fullLink)
      
      setState('waiting')
    } catch (err) {
      console.error('Failed to create session:', err)
      setError('Failed to create chat session. Please try again.')
    }
  }

  const handleTerminate = async () => {
    try {
      if (sessionId) {
        await api.terminateSession(sessionId)
        sessionStorage.removeItem(`chatlly_code_${sessionId}`)
      }
    } catch (err) {
      console.error('Error terminating session:', err)
    } finally {
      onExit()
    }
  }

  const handleCopyLink = () => {
    console.log('Link copied:', chatLink)
  }

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      console.log('Code copied:', code)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-6 max-w-md w-full border border-red-500/20">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-xl">!</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Error</h3>
            <p className="text-grey text-xs mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-white/5 text-white rounded-lg text-xs font-medium hover:bg-white/10 transition-colors border border-white/10"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'selecting') {
    return (
      <DurationSelector
        onSelect={handleDurationSelect}
        onClose={onExit}
      />
    )
  }

  if (state === 'waiting') {
    return (
      <WaitingScreen
        link={chatLink}
        duration={duration}
        code={code}
        sessionId={sessionId}
        onCopy={handleCopyLink}
        onCopyCode={handleCopyCode}
        onTerminate={handleTerminate}
      />
    )
  }

  return null
}

export default ChatPage
