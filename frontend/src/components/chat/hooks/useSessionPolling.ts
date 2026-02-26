import { useEffect, useRef } from 'react';

interface UseSessionPollingProps {
  sessionId: string;
  terminationCompleted: boolean;
  showSecondUserTermination: boolean;
  onStatusUpdate: (data: any) => void;
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

    console.log(`[${connectionId.current}] Starting status polling`);

    const pollStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/session/${sessionId}/status`);
        const data = await response.json();

        onStatusUpdate(data);

        if (data.status === 'active' && data.participant_count === 2) {
          console.log(`[${connectionId.current}] Second user joined`);
        }

        if (data.status === 'expired' || data.status === 'terminated') {
          console.log(`[${connectionId.current}] Session ended:`, data.status);
          onSessionEnded();
        }
      } catch (err) {
        console.error(`[${connectionId.current}] Status poll failed:`, err);
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
