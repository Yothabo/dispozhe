import { describe, it, expect } from 'vitest';

import { parseMessage, encryptMessage } from '../messageParser';

describe('messageParser', () => {
  it('should encrypt and decrypt a message correctly', () => {
    const original = 'Hello, world!';
    const encrypted = encryptMessage(original);
    const decrypted = parseMessage(encrypted);
    
    expect(decrypted).toBe(original);
  });

  it('should handle empty strings', () => {
    const original = '';
    const encrypted = encryptMessage(original);
    const decrypted = parseMessage(encrypted);
    
    expect(decrypted).toBe('');
  });

  it('should handle special characters', () => {
    const original = 'Hello! @#$%^&*()_+ 123';
    const encrypted = encryptMessage(original);
    const decrypted = parseMessage(encrypted);
    
    expect(decrypted).toBe(original);
  });

  it('should handle emojis', () => {
    const original = 'Hello 👋 world 🌍';
    const encrypted = encryptMessage(original);
    const decrypted = parseMessage(encrypted);
    
    expect(decrypted).toBe(original);
  });
});
