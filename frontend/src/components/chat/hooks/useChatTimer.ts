import { useState, useEffect, useRef, useCallback } from 'react';

interface UseChatTimerProps {
  initialDuration: number;
  isConnected: boolean;
  onTimeUp: () => void;
  sessionId: string;
}

export const useChatTimer = ({
  initialDuration,
  isConnected,
  onTimeUp,
  sessionId
}: UseChatTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration * 60);
  const [timeUp, setTimeUp] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const pollingActive = useRef<boolean>(true);
  const sessionEnded = useRef<boolean>(false);
  const timeUpTriggered = useRef<boolean>(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopAllTimers = useCallback(() => {
    pollingActive.current = false;
    sessionEnded.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = undefined;
    }
  }, []);

  const handleTimeUp = useCallback(() => {
    if (timeUpTriggered.current) return;
    timeUpTriggered.current = true;
    setTimeUp(true);
    stopAllTimers();
    onTimeUp();
  }, [onTimeUp, stopAllTimers]);

  const syncWithBackend = useCallback(async () => {
    if (!sessionId || sessionEnded.current || !pollingActive.current) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/session/${sessionId}/status`);
      
      if (!pollingActive.current) return;

      if (response.status === 404) {
        handleTimeUp();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const backendTimeLeft = data.time_left_seconds;
        
        if (backendTimeLeft !== undefined) {
          setTimeLeft(backendTimeLeft);

          if (backendTimeLeft <= 0 && !timeUpTriggered.current) {
            handleTimeUp();
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync timer with backend:', error);
    }
  }, [sessionId, handleTimeUp]);

  useEffect(() => {
    pollingActive.current = true;
    sessionEnded.current = false;
    timeUpTriggered.current = false;

    if (!isConnected) return;

    syncWithBackend();

    const scheduleNextSync = () => {
      if (!pollingActive.current || sessionEnded.current) return;
      
      syncTimeoutRef.current = setTimeout(() => {
        syncWithBackend();
        scheduleNextSync();
      }, 60000);
    };

    scheduleNextSync();

    return () => {
      pollingActive.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isConnected, syncWithBackend]);

  useEffect(() => {
    if (timeUp || !isConnected || sessionEnded.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1 && !timeUpTriggered.current) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeUp, isConnected, handleTimeUp]);

  const stopTimer = useCallback(() => {
    stopAllTimers();
  }, [stopAllTimers]);

  return {
    timeLeft,
    formatTime,
    timeUp,
    setTimeUp,
    stopTimer,
    syncWithBackend
  };
};
