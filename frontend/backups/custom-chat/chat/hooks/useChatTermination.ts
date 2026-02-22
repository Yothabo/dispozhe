import { useState, useCallback, useRef } from 'react';
import { TerminationStep } from '../types';
import api from '../../../services/api';
import wsService from '../../../services/websocket';
import { notifyManagement } from '../../NotificationCenter';

export const useChatTermination = (
  sessionId: string, 
  onTerminate: () => void,
  stopTimer: () => void
) => {
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [terminationCompleted, setTerminationCompleted] = useState(false);
  const [otherUserLeft, setOtherUserLeft] = useState(false);
  const [showSecondUserTermination, setShowSecondUserTermination] = useState(false);
  const terminationMessageShown = useRef<boolean>(false);
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

  const handleInitiatorTerminate = useCallback(() => {
    if (isTerminating || terminationCompleted || otherUserLeft || showSecondUserTermination) return;

    setIsTerminating(true);
    setShowTerminateModal(false);
    stopTimer();

    sessionStorage.removeItem(`Driflly_messages_${sessionId}`);

    setTerminationSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    try {
      wsService.sendMessage({ type: 'participant_leaving', timestamp: Date.now() });
    } catch (e) {}

    notifyManagement('Session termination initiated', 'info');

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

    const timeout3 = setTimeout(async () => {
      if (mountedRef.current) {
        setTerminationCompleted(true);
        setIsTerminating(false);

        try {
          await api.terminateSession(sessionId);
          sessionStorage.removeItem(`Driflly_initiator_${sessionId}`);
          sessionStorage.removeItem(`Driflly_code_${sessionId}`);
          wsService.disconnect();
          notifyManagement('Session terminated successfully', 'success');
        } catch (err) {
          console.error('Termination failed:', err);
          notifyManagement('Failed to terminate session', 'error');
        }
      }
    }, terminationSteps.length * 400 + 800);

    animationTimeouts.current.push(timeout3);
  }, [sessionId, terminationSteps, isTerminating, terminationCompleted, otherUserLeft, showSecondUserTermination, stopTimer]);

  const handleSecondUserTerminate = useCallback(() => {
    if (showSecondUserTermination || terminationCompleted) return;

    setShowSecondUserTermination(true);
    stopTimer();

    setSecondUserSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    notifyManagement('Other user terminated session', 'warning');

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

    const timeout3 = setTimeout(() => {
      if (mountedRef.current) {
        setTerminationCompleted(true);
        setShowSecondUserTermination(false);
        sessionStorage.removeItem(`Driflly_messages_${sessionId}`);
        wsService.disconnect();
      }
    }, secondUserSteps.length * 400 + 800);

    animationTimeouts.current.push(timeout3);
  }, [secondUserSteps, sessionId, showSecondUserTermination, terminationCompleted, stopTimer]);

  const handleParticipantLeaving = useCallback(() => {
    setOtherUserLeft(true);
  }, []);

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
    handleParticipantLeaving,
    terminationMessageShown: terminationMessageShown.current
  };
};
