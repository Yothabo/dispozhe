import { useState, useEffect, useRef } from 'react';
import wsService from '../../../services/websocket';

export const useChatConnection = (sessionId: string, onMessage: (data: any) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectAttempted = useRef<boolean>(false);
  const handlerRegistered = useRef<boolean>(false);
  const connectionId = useRef<string>(`conn-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    console.log(`[${connectionId.current}] useChatConnection effect for session:`, sessionId);
    
    if (!sessionId || connectAttempted.current) {
      console.log(`[${connectionId.current}] Already attempted or no sessionId`);
      return;
    }

    connectAttempted.current = true;
    console.log(`[${connectionId.current}] Attempting to connect to session:`, sessionId);

    // Check if already connected to this session
    if (wsService.isConnected() && wsService.getSessionId() === sessionId) {
      console.log(`[${connectionId.current}] Already connected`);
      setIsConnected(true);
      return;
    }

    // Add message handler first
    if (!handlerRegistered.current) {
      console.log(`[${connectionId.current}] Adding message handler`);
      wsService.addMessageHandler(onMessage);
      handlerRegistered.current = true;
    }

    // Then connect
    wsService.connect(sessionId)
      .then(() => {
        console.log(`[${connectionId.current}] Connected successfully`);
        setIsConnected(true);
      })
      .catch((err) => {
        console.error(`[${connectionId.current}] Connection failed:`, err);
        setIsConnected(false);
      });

    return () => {
      console.log(`[${connectionId.current}] Cleanup`);
      if (handlerRegistered.current) {
        console.log(`[${connectionId.current}] Removing message handler`);
        wsService.removeMessageHandler(onMessage);
        handlerRegistered.current = false;
      }
      // Don't disconnect here - let the component unmount handle it
    };
  }, [sessionId, onMessage]);

  // Separate effect for monitoring connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = wsService.isConnected();
      if (connected !== isConnected) {
        console.log(`[${connectionId.current}] Connection status changed:`, connected);
        setIsConnected(connected);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isConnected]);

  return { isConnected };
};
