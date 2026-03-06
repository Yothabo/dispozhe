import { useState, useEffect, useRef, useCallback } from 'react';

interface UseChatTimerProps {
  initialDuration: number; // in minutes
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
  const [serverTimeLeft, setServerTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpCalled = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(Date.now());
  const driftRef = useRef<number>(0);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Sync with server time
  const syncWithServer = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/session/${sessionId}/status`);
      const data = await response.json();

      if (data.time_left_seconds !== undefined) {
        const serverTime = data.time_left_seconds;
        setServerTimeLeft(serverTime);

        // Calculate drift between local and server time
        const now = Date.now();
        if (lastSyncRef.current) {
          const elapsed = Math.floor((now - lastSyncRef.current) / 1000);
          const expectedDrift = serverTime - (timeLeft - elapsed);
          driftRef.current = expectedDrift;
        }
        lastSyncRef.current = now;

        // Update local time to match server
        setTimeLeft(serverTime);

        if (serverTime <= 0 && !timeUpCalled.current) {
          setTimeUp(true);
          timeUpCalled.current = true;
          onTimeUp();
        }
      }
    } catch (error) {
      console.error('Failed to sync timer with server:', error);
    }
  }, [sessionId, timeLeft, onTimeUp]);

  // Initial sync and periodic polling
  useEffect(() => {
    if (!sessionId || !isConnected) return;

    // Sync immediately
    syncWithServer();

    // Poll server every 10 seconds for accurate time
    pollingRef.current = setInterval(syncWithServer, 10000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sessionId, isConnected, syncWithServer]);

  // Local countdown timer
  useEffect(() => {
    if (timeUp || !isConnected) return;

    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Start new timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;

        // Check if time is up
        if (newTime <= 0 && !timeUpCalled.current) {
          setTimeUp(true);
          timeUpCalled.current = true;
          onTimeUp();

          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isConnected, timeUp, onTimeUp]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  return {
    timeLeft,
    formatTime,
    timeUp,
    setTimeUp,
    stopTimer,
    serverTimeLeft
  };
};
