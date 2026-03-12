import { useCallback, useEffect, useRef, useState } from 'react';
import { EncryptionService } from '../../../lib/encryption/encryptionService';

interface UseEncryptedMessagesProps {
  onMessageDecrypted: (id: string, text: string, timestamp: number) => void;
  encryptionKey?: string;
}

export const useEncryptedMessages = ({
  onMessageDecrypted,
  encryptionKey
}: UseEncryptedMessagesProps) => {
  const encryptionSession = useRef<Awaited<ReturnType<typeof EncryptionService.getInstance>> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [keyId, setKeyId] = useState<string>('');
  const processedIds = useRef<Set<string>>(new Set());
  const initAttempts = useRef(0);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        let session;
        if (encryptionKey) {
          session = await EncryptionService.importSession(encryptionKey);
        } else {
          session = await EncryptionService.getInstance();
        }
        if (!mounted) return;
        encryptionSession.current = session;
        const id = session.getKeyId();
        setKeyId(id);
        setIsReady(true);
      } catch {
        if (!mounted) return;
        if (initAttempts.current < 3) {
          initAttempts.current++;
          setTimeout(init, 1000 * initAttempts.current);
        }
      }
    };
    init();
    return () => {
      mounted = false;
      encryptionSession.current = null;
    };
  }, [encryptionKey]);

  const prepareOutgoingMessage = useCallback(async (text: string, id: string) => {
    if (!encryptionSession.current || !isReady) {
      throw new Error('Encryption not ready');
    }
    const encrypted = await encryptionSession.current.encrypt(text);
    if (!encrypted || !encrypted.data) {
      throw new Error('Encryption failed - no data');
    }
    return {
      type: 'message',
      id: id,
      data: encrypted.data,
      keyId: encrypted.keyId,
      sequence: encrypted.sequence,
      nonce: encrypted.nonce,
      hmac: encrypted.hmac,
      timestamp: Date.now()
    };
  }, [isReady]);

  const handleIncomingMessage = useCallback(async (data: any): Promise<boolean> => {
    if (!data.data || !data.keyId || !data.id) {
      return false;
    }
    if (processedIds.current.has(data.id)) {
      return false;
    }
    if (!encryptionSession.current || !isReady) {
      return false;
    }
    try {
      const decrypted = await encryptionSession.current.decrypt(
        { data: data.data, keyId: data.keyId },
        data.keyId
      );
      if (decrypted) {
        processedIds.current.add(data.id);
        onMessageDecrypted(data.id, decrypted, data.timestamp || Date.now());
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, [isReady, onMessageDecrypted]);

  return {
    handleIncomingMessage,
    prepareOutgoingMessage,
    getKeyId: () => keyId,
    isReady,
    keyId
  };
};
