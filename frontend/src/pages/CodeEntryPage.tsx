import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaKey, FaArrowLeft } from 'react-icons/fa';
import Background from '../components/Background';
import api from '../services/api';

const CodeEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await api.joinWithCode(fullCode);
      navigate(`/waiting/${result.session_id}#${result.encryption_key}`);
    } catch (err: any) {
      console.error('Code entry error:', err);
      if (err.message.includes('404') || err.message.includes('not found') || err.message.includes('Invalid or expired code')) {
        setError('No active chat linked to this code. Please ask for the correct code.');
      } else {
        setError(err.message || 'Failed to join. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length === 6) {
      const newCode = digits.split('');
      setCode(newCode);

      const lastInput = document.getElementById('code-5');
      lastInput?.focus();
    }
  };

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky to-sky-dark flex items-center justify-center mx-auto mb-4">
              <FaKey className="text-navy text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Enter access code</h2>
            <p className="text-grey text-sm font-light">
              Ask the other person for their 6-digit code
            </p>
          </div>

          <div
            className="flex justify-center gap-2 mb-6 px-2"
            onPaste={handlePaste}
          >
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-sky/50 focus:ring-1 focus:ring-sky/50 placeholder:text-grey/30 mx-auto"
                placeholder="0"
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-center gap-2 action-button"
            >
              <FaArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-sky text-navy rounded-xl font-bold hover:bg-sky-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 action-button"
            >
              <FaKey className="w-4 h-4" />
              {isLoading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEntryPage;
