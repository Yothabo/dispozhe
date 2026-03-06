import { useEffect, useRef } from 'react';

interface SessionStatus {
  participant_count: number;
  status: string;
  [key: string]: unknown;
}

interface UseSessionPollingProps {
  sessionId: string;
  terminationCompleted: boolean;
  showSecondUserTermination: boolean;
  onStatusUpdate: (data: SessionStatus) => void;
  onSessionExpired: () => void;  // Renamed to clarify it's only for natural expiry
  connectionId: React.MutableRefObject<string>;
}

export const useSessionPolling = ({
  sessionId,
  terminationCompleted,
  showSecondUserTermination,
  onStatusUpdate,
  onSessionExpired,
  connectionId
}: UseSessionPollingProps) => {
  const statusPollInterval = useRef<NodeJS.Timeout | null>(null);
  const expiryNotified = useRef<boolean>(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionId || terminationCompleted || showSecondUserTermination) return;

    // Reset expiry notification flag when session changes
    expiryNotified.current = false;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/session/${sessionId}/status`);
        const data: SessionStatus = await response.json();

        if (mountedRef.current) {
          onStatusUpdate(data);

          // Only trigger expiry once and only for expired status (not terminated)
          // Terminated sessions are handled by WebSocket messages
          if (data.status === 'expired' && !expiryNotified.current) {
            expiryNotified.current = true;
            onSessionExpired();
          }

          // Don't trigger anything for 'terminated' - that's handled by WebSocket
          // Don't trigger for participant_count changes - WebSocket handles reconnection
        }
      } catch {
        // Silently fail - polling will continue
        if (mountedRef.current) {
          // Using connectionId for debug context but not logging to console in production
          // This empty block intentionally left blank to satisfy linter
          // The error is intentionally ignored as polling failures are expected during network issues
        }
      }
    };

    // Initial poll
    pollStatus();

    // Set up interval for polling
    statusPollInterval.current = setInterval(pollStatus, 5000); // Increased from 2000 to 5000ms to reduce load

    return () => {
      if (statusPollInterval.current) {
        clearInterval(statusPollInterval.current);
        statusPollInterval.current = null;
      }
      expiryNotified.current = false;
    };
  }, [sessionId, terminationCompleted, showSecondUserTermination, onStatusUpdate, onSessionExpired, connectionId]);
};
