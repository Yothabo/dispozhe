export interface EncryptedMessage {
  data: string;
  keyId: string;
}

export interface SecureMessage extends EncryptedMessage {
  sequence: number;
  nonce: string;
  hmac?: string;
}

class AesGcmEncryption {
  private key: CryptoKey | null = null;
  private keyId: string = '';
  private keyData: Uint8Array | null = null;
  private sequenceCounter: number = 0;
  private hmacKey: CryptoKey | null = null;

  async generateKey(): Promise<void> {
    this.key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await crypto.subtle.exportKey('raw', this.key);
    this.keyData = new Uint8Array(exported);
    const keyB64 = btoa(String.fromCharCode(...this.keyData));
    this.keyId = keyB64.substring(0, 8);
    const hmacKeyMaterial = await crypto.subtle.importKey(
      'raw',
      this.keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    this.hmacKey = hmacKeyMaterial;
  }

  async importKey(keyB64: string): Promise<void> {
    try {
      const keyBytes = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
      this.key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      this.keyData = keyBytes;
      this.keyId = keyB64.substring(0, 8);
      const hmacKeyMaterial = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      );
      this.hmacKey = hmacKeyMaterial;
    } catch (error) {
      throw new Error('Invalid key format');
    }
  }

  async generateHmac(data: string, sequence: number, nonce: string): Promise<string> {
    if (!this.hmacKey) {
      throw new Error('[HMAC] Key not initialized');
    }
    const message = `${data}:${sequence}:${nonce}`;
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
      'HMAC',
      this.hmacKey,
      encoder.encode(message)
    );
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  generateNonce(): string {
    const nonce = crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode(...nonce)).substring(0, 22);
  }

  async encrypt(message: string): Promise<SecureMessage> {
    if (!this.key) {
      throw new Error('[AES-GCM] Key not initialized');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      this.key,
      data
    );
    const result = new Uint8Array(iv.length + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), iv.length);
    const sequence = ++this.sequenceCounter;
    const nonce = this.generateNonce();
    const encryptedData = btoa(String.fromCharCode(...result));
    const hmac = await this.generateHmac(encryptedData, sequence, nonce);
    return {
      data: encryptedData,
      keyId: this.keyId,
      sequence,
      nonce,
      hmac
    };
  }

  async decrypt(encrypted: EncryptedMessage, senderKeyId: string): Promise<string> {
    if (!this.key) {
      throw new Error('[AES-GCM] Key not initialized');
    }
    if (senderKeyId !== this.keyId) {
      throw new Error('Key ID mismatch - session keys do not match');
    }
    try {
      const data = Uint8Array.from(atob(encrypted.data), c => c.charCodeAt(0));
      if (data.length < 28) {
        throw new Error('Invalid encrypted data - too short');
      }
      const iv = data.slice(0, 12);
      const ciphertext = data.slice(12);
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        this.key,
        ciphertext
      );
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed - message may be corrupted');
    }
  }

  exportKey(): string {
    if (!this.keyData) {
      throw new Error('[AES-GCM] No key to export');
    }
    return btoa(String.fromCharCode(...this.keyData));
  }

  getKeyId(): string {
    return this.keyId;
  }

  isReady(): boolean {
    return this.key !== null;
  }

  resetSequence(): void {
    this.sequenceCounter = 0;
  }
}

export class EncryptionSession {
  private impl: AesGcmEncryption;

  private constructor(impl: AesGcmEncryption) {
    this.impl = impl;
  }

  static async create(): Promise<EncryptionSession> {
    const impl = new AesGcmEncryption();
    await impl.generateKey();
    return new EncryptionSession(impl);
  }

  static async import(keyB64: string): Promise<EncryptionSession> {
    const impl = new AesGcmEncryption();
    await impl.importKey(keyB64);
    return new EncryptionSession(impl);
  }

  async encrypt(message: string): Promise<SecureMessage> {
    return this.impl.encrypt(message);
  }

  async decrypt(encrypted: EncryptedMessage, senderKeyId: string): Promise<string> {
    return this.impl.decrypt(encrypted, senderKeyId);
  }

  exportKey(): string {
    return this.impl.exportKey();
  }

  getKeyId(): string {
    return this.impl.getKeyId();
  }

  isReady(): boolean {
    return this.impl.isReady();
  }

  resetSequence(): void {
    this.impl.resetSequence();
  }
}

export class EncryptionService {
  private static instance: EncryptionSession | null = null;

  static async getInstance(): Promise<EncryptionSession> {
    if (!EncryptionService.instance) {
      EncryptionService.instance = await EncryptionSession.create();
    }
    return EncryptionService.instance;
  }

  static async importSession(keyB64: string): Promise<EncryptionSession> {
    EncryptionService.instance = await EncryptionSession.import(keyB64);
    return EncryptionService.instance;
  }

  static reset(): void {
    if (EncryptionService.instance) {
      EncryptionService.instance.resetSequence();
      EncryptionService.instance = null;
    }
  }
}
