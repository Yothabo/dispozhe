import React, { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import wsService, { WebSocketMessage } from '../services/websocket';
import { EncryptionSession } from '../lib/encryption/encryptionService';

interface WebSocketContextType {
  sendEncrypted: (text: string) => Promise<{ id: string; encrypted: string; keyId: string } | null>;
  isReady: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useEncryption = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useEncryption must be used within EncryptionProvider');
  }
  return context;
};

interface EncryptionProviderProps {
  sessionId: string;
  encryptionKey?: string;
  children: React.ReactNode;
  onMessageDecrypted?: (id: string, text: string, timestamp: number) => void;
}

export const EncryptionProvider: React.FC<EncryptionProviderProps> = ({
  sessionId: _sessionId,
  encryptionKey,
  children,
  onMessageDecrypted
}) => {
  const encryptionSession = useRef<EncryptionSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const keyId = useRef<string>('');

  useEffect(() => {
    const initEncryption = async () => {
      try {
        if (encryptionKey) {
          encryptionSession.current = await EncryptionSession.import(encryptionKey);
        } else {
          encryptionSession.current = await EncryptionSession.create();
        }
        keyId.current = encryptionSession.current.getKeyId();
        setIsReady(true);
        if (!encryptionKey && encryptionSession.current) {
          wsService.sendMessage({
            type: 'key_exchange',
            keyId: keyId.current,
            timestamp: Date.now()
          });
        }
      } catch {
        // Silently fail - will show connection status in UI
      }
    };
    initEncryption();
  }, [encryptionKey]);

  useEffect(() => {
    const handleEncryptedMessage = (data: WebSocketMessage) => {
      if (data.type === 'message' && data.data && data.keyId && onMessageDecrypted) {
        if (!encryptionSession.current) return;
        encryptionSession.current.decrypt(
          { data: data.data as string, keyId: data.keyId as string },
          data.keyId as string
        ).then(decrypted => {
          onMessageDecrypted(data.id as string, decrypted, data.timestamp as number);
        }).catch(() => {
          // Silently fail - message will be shown as undecryptable
        });
      }
    };
    wsService.addMessageHandler(handleEncryptedMessage);
    return () => wsService.removeMessageHandler(handleEncryptedMessage);
  }, [onMessageDecrypted]);

  const sendEncrypted = useCallback(async (text: string) => {
    if (!encryptionSession.current || !wsService.isConnected()) {
      return null;
    }
    const messageId = crypto.randomUUID();
    try {
      const encrypted = await encryptionSession.current.encrypt(text);
      return {
        id: messageId,
        encrypted: encrypted.data,
        keyId: encrypted.keyId
      };
    } catch {
      return null;
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ sendEncrypted, isReady }}>
      {children}
    </WebSocketContext.Provider>
  );
};
