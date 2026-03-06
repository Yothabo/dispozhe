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
  onSessionEnded: () => void;
  connectionId: React.MutableRefObject<string>;
}

export const useSessionPolling = ({
  sessionId,
  terminationCompleted,
  showSecondUserTermination,
  onStatusUpdate,
  onSessionEnded,
  connectionId
}: UseSessionPollingProps) => {
  const statusPollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sessionId || terminationCompleted || showSecondUserTermination) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/session/${sessionId}/status`);
        const data: SessionStatus = await response.json();

        onStatusUpdate(data);

        if (data.status === 'expired' || data.status === 'terminated') {
          onSessionEnded();
        }
      } catch {
        // Silently fail - polling will continue
      }
    };

    pollStatus();
    statusPollInterval.current = setInterval(pollStatus, 2000);

    return () => {
      if (statusPollInterval.current) {
        clearInterval(statusPollInterval.current);
        statusPollInterval.current = null;
      }
    };
  }, [sessionId, terminationCompleted, showSecondUserTermination, onStatusUpdate, onSessionEnded, connectionId]);
};
