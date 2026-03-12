import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncryptionService, EncryptionSession } from '../lib/encryption/encryptionService';

describe('AES-GCM Encryption', () => {
  let session: EncryptionSession;

  beforeEach(async () => {
    session = await EncryptionSession.create();
  });

  afterEach(() => {
    EncryptionService.reset();
  });

  it('should generate unique keys for each session', async () => {
    const session2 = await EncryptionSession.create();
    expect(session.getKeyId()).not.toBe(session2.getKeyId());
    expect(session.exportKey()).not.toBe(session2.exportKey());
  });

  it('should encrypt and decrypt simple text', async () => {
    const original = 'Hello, World!';
    const encrypted = await session.encrypt(original);
    const decrypted = await session.decrypt(encrypted, encrypted.keyId);
    expect(decrypted).toBe(original);
  });

  it('should handle special characters', async () => {
    const original = '!@#$%^&*()_+[]{}|;:,.<>?';
    const encrypted = await session.encrypt(original);
    const decrypted = await session.decrypt(encrypted, encrypted.keyId);
    expect(decrypted).toBe(original);
  });

  it('should handle unicode characters', async () => {
    const original = 'Hello 世界 🌍 🚀 你好';
    const encrypted = await session.encrypt(original);
    const decrypted = await session.decrypt(encrypted, encrypted.keyId);
    expect(decrypted).toBe(original);
  });

  it('should handle empty string', async () => {
    const original = '';
    const encrypted = await session.encrypt(original);
    const decrypted = await session.decrypt(encrypted, encrypted.keyId);
    expect(decrypted).toBe(original);
  });

  it('should handle long messages (10KB)', async () => {
    const original = 'A'.repeat(10 * 1024);
    const encrypted = await session.encrypt(original);
    const decrypted = await session.decrypt(encrypted, encrypted.keyId);
    expect(decrypted).toBe(original);
  });

  it('should handle very long messages (100KB)', async () => {
    const original = 'B'.repeat(100 * 1024);
    const encrypted = await session.encrypt(original);
    const decrypted = await session.decrypt(encrypted, encrypted.keyId);
    expect(decrypted).toBe(original);
  });

  it('should export and import keys correctly', async () => {
    const original = 'Test message for key export/import';
    
    // Encrypt with original session
    const encrypted = await session.encrypt(original);
    
    // Export key
    const exportedKey = session.exportKey();
    
    // Create new session with imported key
    const importedSession = await EncryptionSession.import(exportedKey);
    
    // Decrypt with imported session
    const decrypted = await importedSession.decrypt(encrypted, encrypted.keyId);
    
    expect(decrypted).toBe(original);
    expect(session.getKeyId()).toBe(importedSession.getKeyId());
  });

  it('should reject decryption with wrong key ID', async () => {
    const original = 'Secret message';
    const encrypted = await session.encrypt(original);
    
    const wrongSession = await EncryptionSession.create();
    
    await expect(
      wrongSession.decrypt(encrypted, encrypted.keyId)
    ).rejects.toThrow('Key ID mismatch');
  });

  it('should reject tampered messages', async () => {
    const original = 'Secret message';
    const encrypted = await session.encrypt(original);
    
    // Tamper with the encrypted data
    const tampered = {
      ...encrypted,
      data: encrypted.data + 'a' // Add one char to corrupt
    };
    
    await expect(
      session.decrypt(tampered, encrypted.keyId)
    ).rejects.toThrow();
  });

  it('should produce different ciphertext for same message', async () => {
    const message = 'Same message';
    
    const encrypted1 = await session.encrypt(message);
    const encrypted2 = await session.encrypt(message);
    
    // Different IVs should produce different ciphertext
    expect(encrypted1.data).not.toBe(encrypted2.data);
    
    // But both should decrypt correctly
    const decrypted1 = await session.decrypt(encrypted1, encrypted1.keyId);
    const decrypted2 = await session.decrypt(encrypted2, encrypted2.keyId);
    
    expect(decrypted1).toBe(message);
    expect(decrypted2).toBe(message);
  });

  it('should work with singleton EncryptionService', async () => {
    const service1 = await EncryptionService.getInstance();
    const service2 = await EncryptionService.getInstance();
    
    // Should return same instance
    expect(service1.getKeyId()).toBe(service2.getKeyId());
    
    const message = 'Singleton test';
    const encrypted = await service1.encrypt(message);
    const decrypted = await service2.decrypt(encrypted, encrypted.keyId);
    
    expect(decrypted).toBe(message);
  });

  it('should import session via EncryptionService', async () => {
    const originalSession = await EncryptionSession.create();
    const message = 'Import test';
    const encrypted = await originalSession.encrypt(message);
    const exportedKey = originalSession.exportKey();
    
    const importedSession = await EncryptionService.importSession(exportedKey);
    const decrypted = await importedSession.decrypt(encrypted, encrypted.keyId);
    
    expect(decrypted).toBe(message);
    expect(importedSession.getKeyId()).toBe(originalSession.getKeyId());
  });

  it('should handle concurrent encryption/decryption', async () => {
    const messages = [
      'First message',
      'Second message with unicode 🎉',
      'Third!@#$%^&*()',
      'Fourth message that is quite long to test concurrent processing',
      'Fifth message'
    ];
    
    // Encrypt all messages concurrently
    const encryptedPromises = messages.map(msg => session.encrypt(msg));
    const encryptedResults = await Promise.all(encryptedPromises);
    
    // Decrypt all messages concurrently
    const decryptedPromises = encryptedResults.map((enc, i) => 
      session.decrypt(enc, enc.keyId).then(result => ({
        original: messages[i],
        decrypted: result
      }))
    );
    
    const results = await Promise.all(decryptedPromises);
    
    results.forEach(({ original, decrypted }) => {
      expect(decrypted).toBe(original);
    });
  });
});
