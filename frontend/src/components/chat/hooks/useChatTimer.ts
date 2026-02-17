import { useState, useCallback, useRef } from 'react';
import { useTimer } from '../../../hooks/useTimer';
import { notifyManagement } from '../../NotificationCenter';

export const useChatTimer = (
  duration: number,
  isConnected: boolean,
  addMessage: (message: any) => void,
  wsService: any
) => {
  const [timeUp, setTimeUp] = useState(false);
  const timeUpMessageShown = useRef<boolean>(false);

  const handleTimeUp = useCallback(() => {
    if (timeUpMessageShown.current || timeUp) return;
    timeUpMessageShown.current = true;
    setTimeUp(true);

    addMessage({
      id: `timeup-${Date.now()}`,
      text: 'Chat duration has ended. Please terminate the session.',
      sender: 'system',
      timestamp: Date.now()
    });

    if (isConnected) {
      wsService.sendMessage({ type: 'time_up', timestamp: Date.now() });
    }
    
    notifyManagement('Chat session expired', 'warning');
  }, [isConnected, timeUp, addMessage, wsService]);

  const { timeLeft, formatTime, stopTimer } = useTimer(
    duration * 60,
    handleTimeUp
  );

  const handleTimeUpMessage = useCallback(() => {
    if (timeUpMessageShown.current || timeUp) return;
    timeUpMessageShown.current = true;
    setTimeUp(true);

    addMessage({
      id: `timeup-${Date.now()}`,
      text: 'Chat duration has ended. Please terminate the session.',
      sender: 'system',
      timestamp: Date.now()
    });
    notifyManagement('Chat duration ended', 'warning');
  }, [timeUp, addMessage]);

  return {
    timeLeft,
    formatTime,
    timeUp,
    setTimeUp,
    stopTimer,
    handleTimeUpMessage,
    timeUpMessageShown
  };
};
