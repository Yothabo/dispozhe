import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import ActiveChat from '../../components/chat/ActiveChat';
import { EncryptionProvider } from '../../contexts/WebSocketContext';

describe('Memory Leak Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should not leak memory during long chat sessions', async () => {
    if (typeof global.gc !== 'function') {
      return;
    }

    const sessions = [];
    const initialMemory = process.memoryUsage().heapUsed;

    for (let session = 0; session < 10; session++) {
      const { unmount } = render(
        <EncryptionProvider sessionId={`leak-test-${session}`}>
          <ActiveChat
            sessionId={`leak-test-${session}`}
            duration={60}
            onTerminate={() => {}}
          />
        </EncryptionProvider>
      );

      sessions.push({ unmount });

      for (let minute = 0; minute < 5; minute++) {
        await act(async () => {
          vi.advanceTimersByTime(60000);
          for (let msg = 0; msg < 10; msg++) {
            const mockWs = global.WebSocket as any;
            if (mockWs.onmessage) {
              mockWs.onmessage({
                data: JSON.stringify({
                  type: 'message',
                  id: `msg-${session}-${minute}-${msg}`,
                  data: btoa('x'.repeat(1000)),
                  keyId: 'test-key',
                  timestamp: Date.now()
                })
              });
            }
          }
        });
        global.gc();
      }
      unmount();
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
  });

  it('should handle rapid event listener attachment/detachment', async () => {
    const listenersAttached: number[] = [];
    const listenersDetached: number[] = [];

    for (let i = 0; i < 100; i++) {
      const addListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <EncryptionProvider sessionId={`listener-test-${i}`}>
          <ActiveChat
            sessionId={`listener-test-${i}`}
            duration={5}
            onTerminate={() => {}}
          />
        </EncryptionProvider>
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      listenersAttached.push(addListenerSpy.mock.calls.length);
      unmount();
      listenersDetached.push(removeListenerSpy.mock.calls.length);
      addListenerSpy.mockRestore();
      removeListenerSpy.mockRestore();
    }

    const avgAttached = listenersAttached.reduce((a, b) => a + b, 0) / listenersAttached.length;
    const avgDetached = listenersDetached.reduce((a, b) => a + b, 0) / listenersDetached.length;
    expect(avgAttached).toBeCloseTo(avgDetached, 1);
  });
});
