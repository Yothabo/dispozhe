import { useState, useEffect, useRef, useCallback } from 'react';

interface UseChatTimerProps {
  sessionId: string;  // Kept for API compatibility but not used
  initialDuration: number;
  isConnected: boolean;
  onTimeUp: () => void;
}

export const useChatTimer = ({
  sessionId,  // Kept for API compatibility
  initialDuration,
  isConnected,
  onTimeUp
}: UseChatTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration * 60);
  const [timeUp, setTimeUp] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpRef = useRef<boolean>(false);
  const sessionEnded = useRef<boolean>(false);

  // Silence unused variable warning
  void sessionId;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    sessionEnded.current = true;
  }, []);

  // Simple countdown timer - no server sync, no guardrails
  useEffect(() => {
    if (!isConnected || sessionEnded.current || timeUpRef.current) return;

    // Start countdown from initial duration
    setTimeLeft(initialDuration * 60);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (!timeUpRef.current && !sessionEnded.current) {
            timeUpRef.current = true;
            setTimeUp(true);
            onTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isConnected, initialDuration, onTimeUp]);

  return {
    timeLeft,
    formatTime,
    timeUp,
    stopTimer
  };
};
