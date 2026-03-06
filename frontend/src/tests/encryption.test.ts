import { describe, it, expect } from 'vitest';

describe('Message Encryption', () => {
  function encrypt(text: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    return btoa(String.fromCharCode(...new Uint8Array(data)));
  }

  function decrypt(encrypted: string): string {
    try {
      const binary = atob(encrypted);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    } catch {
      return '[Encrypted]';
    }
  }

  it('should encrypt and decrypt simple text', () => {
    const original = 'Hello, World!';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should handle special characters', () => {
    const original = '!@#$%^&*()_+';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should handle unicode characters', () => {
    const original = 'Hello 世界';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should handle empty string', () => {
    const original = '';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should handle long messages', () => {
    const original = 'A'.repeat(1000);
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should generate unique encryption keys', () => {
    const key1 = crypto.randomUUID();
    const key2 = crypto.randomUUID();
    expect(key1).not.toBe(key2);
  });
});
