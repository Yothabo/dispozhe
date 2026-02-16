import React, { useState } from 'react'
import { FaClock, FaTimes } from 'react-icons/fa'

interface DurationSelectorProps {
  onSelect: (minutes: number) => void
  onClose: () => void
}

const DurationSelector: React.FC<DurationSelectorProps> = ({ onSelect, onClose }) => {
  const [customMinutes, setCustomMinutes] = useState<string>('')
  
  const durations = [
    { minutes: 5, display: '05' },
    { minutes: 10, display: '10' },
    { minutes: 30, display: '30' },
    { minutes: 60, display: '60' },
  ]

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value === '' || parseInt(value) <= 60) {
      setCustomMinutes(value)
    }
  }

  const handleCustomSelect = () => {
    const minutes = parseInt(customMinutes)
    if (minutes && minutes > 0 && minutes <= 60) {
      onSelect(minutes)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
        >
          <FaTimes className="w-4 h-4 text-grey" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky to-sky-dark flex items-center justify-center mx-auto mb-4">
            <FaClock className="text-navy text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Choose duration</h2>
          <p className="text-grey text-sm font-light">
            How long should your chat exist?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {durations.map((duration) => (
            <button
              key={duration.minutes}
              onClick={() => onSelect(duration.minutes)}
              className="group p-4 bg-white/5 rounded-xl hover:bg-sky/10 transition-colors border border-white/10 hover:border-sky/20 flex flex-col items-center justify-center"
              style={{ height: '96px' }}
            >
              <div className="font-goldman text-3xl font-bold text-grey mb-1 tracking-wider">
                {duration.display}
              </div>
              <div className="text-xs text-grey/50 font-light">
                {duration.minutes} minutes
              </div>
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-navy text-grey font-light">or custom</span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={customMinutes}
              onChange={handleCustomChange}
              placeholder="max 60"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center font-goldman text-xl font-bold focus:outline-none focus:border-sky/50 placeholder:text-grey/30 placeholder:text-sm placeholder:font-light placeholder:tracking-normal"
              style={{ height: '56px' }}
            />
          </div>
          <button
            onClick={handleCustomSelect}
            disabled={!customMinutes || parseInt(customMinutes) <= 0 || parseInt(customMinutes) > 60}
            className="px-6 py-3 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark transition-colors disabled:opacity-50 flex items-center justify-center duration-action-button"
            style={{ height: '56px' }}
          >
            Set
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-grey/50 text-xs font-light">
            Chat self-destructs automatically after timer expires
          </p>
        </div>
      </div>
    </div>
  )
}

export default DurationSelector
