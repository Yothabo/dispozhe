import { useState, useCallback, useRef } from 'react';
import { TerminationStep } from '../types';
import api from '../../../services/api';
import wsService from '../../../services/websocket';
import { notifyManagement } from '../../NotificationCenter';

export const useChatTermination = (
  sessionId: string,
  _onTerminate?: () => void,
  stopTimer?: () => void
) => {
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [terminationCompleted, setTerminationCompleted] = useState(false);
  const [otherUserLeft, setOtherUserLeft] = useState(false);
  const [showSecondUserTermination, setShowSecondUserTermination] = useState(false);
  const mountedRef = useRef(true);
  const animationTimeouts = useRef<NodeJS.Timeout[]>([]);

  const [secondUserSteps, setSecondUserSteps] = useState<TerminationStep[]>([
    { id: 1, label: 'Session terminated by other user', status: 'pending' },
    { id: 2, label: 'Encryption keys destroyed', status: 'pending' },
    { id: 3, label: 'Session data cleared from server', status: 'pending' },
    { id: 4, label: 'Encrypted tunnel closed', status: 'pending' },
    { id: 5, label: 'All traces purged', status: 'pending' }
  ]);

  const [terminationSteps, setTerminationSteps] = useState<TerminationStep[]>([
    { id: 1, label: 'Destroy session link', status: 'pending' },
    { id: 2, label: 'Wipe encryption keys from memory', status: 'pending' },
    { id: 3, label: 'Clear session data from server', status: 'pending' },
    { id: 4, label: 'Close encrypted tunnel', status: 'pending' },
    { id: 5, label: 'Purge all traces from database', status: 'pending' }
  ]);

  const handleInitiatorTerminate = useCallback(async () => {
    if (isTerminating || terminationCompleted || otherUserLeft || showSecondUserTermination) return;

    setIsTerminating(true);
    setShowTerminateModal(false);
    
    // Stop the timer immediately
    if (stopTimer) stopTimer();

    sessionStorage.removeItem(`Driflly_messages_${sessionId}`);

    setTerminationSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    // First, terminate the session on the server
    try {
      await api.terminateSession(sessionId);
      
      // Send leaving notification to other participants
      wsService.sendMessage({ type: 'participant_leaving', timestamp: Date.now() });
      
      // Disconnect WebSocket
      wsService.disconnect();
      
      notifyManagement('Session termination initiated', 'info');
    } catch (err) {
      console.error('Failed to terminate session on server:', err);
      notifyManagement('Failed to terminate session', 'error');
    }

    // Run animation steps
    terminationSteps.forEach((item, index) => {
      const timeout1 = setTimeout(() => {
        if (mountedRef.current) {
          setTerminationSteps(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'loading' } : i)
          );
        }
      }, index * 400);

      const timeout2 = setTimeout(() => {
        if (mountedRef.current) {
          setTerminationSteps(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i)
          );
        }
      }, index * 400 + 400);

      animationTimeouts.current.push(timeout1, timeout2);
    });

    // Mark as completed after animation
    setTimeout(() => {
      if (mountedRef.current) {
        setTerminationCompleted(true);
        setIsTerminating(false);
        notifyManagement('Session terminated successfully', 'success');
      }
    }, terminationSteps.length * 400 + 800);

  }, [sessionId, terminationSteps, isTerminating, terminationCompleted, otherUserLeft, showSecondUserTermination, stopTimer]);

  const handleSecondUserTerminate = useCallback(() => {
    if (showSecondUserTermination || terminationCompleted) return;

    setShowSecondUserTermination(true);
    
    // Stop the timer immediately
    if (stopTimer) stopTimer();

    setSecondUserSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    notifyManagement('Other user terminated session', 'warning');

    // Disconnect WebSocket
    wsService.disconnect();

    secondUserSteps.forEach((item, index) => {
      const timeout1 = setTimeout(() => {
        if (mountedRef.current) {
          setSecondUserSteps(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'loading' } : i)
          );
        }
      }, index * 400);

      const timeout2 = setTimeout(() => {
        if (mountedRef.current) {
          setSecondUserSteps(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i)
          );
        }
      }, index * 400 + 400);

      animationTimeouts.current.push(timeout1, timeout2);
    });

    setTimeout(() => {
      if (mountedRef.current) {
        setTerminationCompleted(true);
        setShowSecondUserTermination(false);
        sessionStorage.removeItem(`Driflly_messages_${sessionId}`);
      }
    }, secondUserSteps.length * 400 + 800);
  }, [secondUserSteps, sessionId, showSecondUserTermination, terminationCompleted, stopTimer]);

  const handleParticipantLeaving = useCallback(() => {
    setOtherUserLeft(true);
    // Stop the timer when other user leaves
    if (stopTimer) stopTimer();
  }, [stopTimer]);

  return {
    showTerminateModal,
    setShowTerminateModal,
    isTerminating,
    terminationCompleted,
    otherUserLeft,
    setOtherUserLeft,
    showSecondUserTermination,
    secondUserSteps,
    terminationSteps,
    handleInitiatorTerminate,
    handleSecondUserTerminate,
    handleParticipantLeaving
  };
};
