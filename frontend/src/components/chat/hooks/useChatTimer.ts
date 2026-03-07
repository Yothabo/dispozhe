import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import wsService from '../../../services/websocket';

interface WebSocketMessage {
  type: string;
  time_left?: number;
  [key: string]: unknown;
}

interface UseChatTimerProps {
  sessionId: string;
  initialDuration: number;
  isConnected: boolean;
  onTimeUp: () => void;
}

export const useChatTimer = ({
  sessionId,
  initialDuration,
  isConnected,
  onTimeUp
}: UseChatTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration * 60);
  const [timeUp, setTimeUp] = useState<boolean>(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const timeUpRef = useRef<boolean>(false);
  const sessionEnded = useRef<boolean>(false);
  const syncAttempts = useRef<number>(0);
  const expiryNotified = useRef<boolean>(false); // Prevent multiple expiry notifications

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const stopTimer = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    sessionEnded.current = true;
  }, []);

  // Single source of truth for expiry
  const handleExpiry = useCallback(() => {
    if (expiryNotified.current || timeUpRef.current || sessionEnded.current) return;
    
    expiryNotified.current = true;
    timeUpRef.current = true;
    setTimeUp(true);
    onTimeUp();
    stopTimer();
  }, [onTimeUp, stopTimer]);

  // Fetch current time from server
  const fetchServerTime = useCallback(async () => {
    if (sessionEnded.current || timeUpRef.current || expiryNotified.current) return;

    try {
      const status = await api.getSessionStatus(sessionId);

      // If session no longer exists or is expired, trigger expiry
      if (!status) {
        handleExpiry();
        return;
      }

      // Check status first - this is the source of truth
      if (status.status === 'expired' || status.status === 'terminated') {
        handleExpiry();
        return;
      }

      const serverSeconds = status.time_left_seconds;

      // Update display time
      setTimeLeft(serverSeconds);

      // Check if time is up according to server
      if (serverSeconds <= 0) {
        handleExpiry();
        return;
      }

      // Reset sync attempts on successful fetch
      syncAttempts.current = 0;

    } catch (error) {
      console.error('Failed to fetch server time:', error);

      // If we fail to fetch multiple times, assume session is dead
      syncAttempts.current++;
      if (syncAttempts.current > 3 && !timeUpRef.current && !sessionEnded.current) {
        handleExpiry();
      }
    }
  }, [sessionId, handleExpiry]);

  // Listen for WebSocket messages about time
  useEffect(() => {
    const handleTimeMessage = (data: WebSocketMessage) => {
      if (sessionEnded.current || timeUpRef.current || expiryNotified.current) return;

      if (data.type === 'time_update' && typeof data.time_left === 'number') {
        setTimeLeft(data.time_left);

        if (data.time_left <= 0) {
          handleExpiry();
        }
      }

      if (data.type === 'session_terminated' || data.type === 'participant_left') {
        sessionEnded.current = true;
        stopTimer();
      }
    };

    wsService.addMessageHandler(handleTimeMessage);
    return () => wsService.removeMessageHandler(handleTimeMessage);
  }, [handleExpiry, stopTimer]);

  // Poll server for time updates
  useEffect(() => {
    if (!sessionId || !isConnected || sessionEnded.current || timeUpRef.current || expiryNotified.current) return;

    // Fetch immediately on mount/connect
    fetchServerTime();

    // Then poll every 5 seconds
    pollingInterval.current = setInterval(fetchServerTime, 5000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [sessionId, isConnected, fetchServerTime]);

  // Sync on visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sessionEnded.current && !timeUpRef.current && !expiryNotified.current) {
        fetchServerTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchServerTime]);

  return {
    timeLeft,
    formatTime,
    timeUp,
    stopTimer
  };
};
