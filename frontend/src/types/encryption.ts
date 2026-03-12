export interface EncryptedPayload {
  data: string;      // Base64 encoded IV + ciphertext
  keyId: string;      // First 8 chars of key for identification
}

export interface EncryptionKey {
  id: string;
  key: CryptoKey;
  exported?: string;
}

export interface EncryptedMessage {
  id: string;
  encrypted: string;  // Legacy field, use data instead
  keyId: string;
  timestamp: number;
  type: 'message';
}

export interface KeyExchangeMessage {
  type: 'key_exchange';
  keyId: string;
  timestamp: number;
}

// NEW: Final payload format for Day 2
export interface EncryptedPayloadV2 {
  type: 'encrypted';
  ciphertext: string;  // Base64 of IV + ciphertext
  iv: string;          // Separate IV for clarity (optional, can be in ciphertext)
  meta: {
    messageId: string;
    timestamp: number;
  };
  keyId: string;
}

// Helper to convert between formats (for backward compatibility)
export function toV2Payload(message: EncryptedMessage): EncryptedPayloadV2 {
  // Extract IV and ciphertext from combined data (first 12 bytes are IV)
  const data = atob(message.encrypted);
  const iv = data.substring(0, 12);
  const ciphertext = data.substring(12);
  
  return {
    type: 'encrypted',
    ciphertext: btoa(ciphertext),
    iv: btoa(iv),
    meta: {
      messageId: message.id,
      timestamp: message.timestamp
    },
    keyId: message.keyId
  };
}

export function fromV2Payload(payload: EncryptedPayloadV2): EncryptedMessage {
  // Combine IV and ciphertext
  const iv = atob(payload.iv);
  const ciphertext = atob(payload.ciphertext);
  const combined = btoa(iv + ciphertext);
  
  return {
    type: 'message',
    id: payload.meta.messageId,
    encrypted: combined,
    keyId: payload.keyId,
    timestamp: payload.meta.timestamp
  };
}
