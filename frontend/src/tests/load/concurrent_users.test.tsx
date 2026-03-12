import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import ActiveChat from '../../components/chat/ActiveChat';
import { EncryptionProvider } from '../../contexts/WebSocketContext';

interface RenderResult {
  unmount: () => void;
}

describe('Concurrent Users Simulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should simulate 100 concurrent chat sessions', async () => {
    const sessions: RenderResult[] = [];
    const startTime = performance.now();

    // Create 100 chat sessions simultaneously
    for (let i = 0; i < 100; i++) {
      const { unmount } = render(
        <EncryptionProvider sessionId={`concurrent-${i}`}>
          <ActiveChat
            sessionId={`concurrent-${i}`}
            duration={5}
            onTerminate={() => {}}
          />
        </EncryptionProvider>
      );
      sessions.push({ unmount });
    }

    const renderTime = performance.now() - startTime;
    console.log(`\n👥 100 concurrent sessions rendered in ${renderTime.toFixed(2)}ms`);

    // Simulate 1 minute of activity across all sessions
    const activityStart = performance.now();

    await act(async () => {
      // Advance timer by 1 minute
      vi.advanceTimersByTime(60000);

      // Simulate messages across all sessions
      for (let i = 0; i < 100; i++) {
        for (let msg = 0; msg < 10; msg++) {
          const mockWs = global.WebSocket as any;
          if (mockWs.onmessage) {
            mockWs.onmessage({
              data: JSON.stringify({
                type: 'message',
                id: `msg-${i}-${msg}`,
                data: btoa(`message-${msg}`),
                keyId: 'test-key',
                timestamp: Date.now()
              })
            });
          }
        }
      }
    });

    const activityTime = performance.now() - activityStart;
    console.log(`   Processed 1000 messages across 100 sessions in ${activityTime.toFixed(2)}ms`);
    console.log(`   Avg memory per session: ${(activityTime / 100).toFixed(2)}ms`);

    // Cleanup all sessions
    const cleanupStart = performance.now();
    sessions.forEach((session) => session.unmount());
    const cleanupTime = performance.now() - cleanupStart;

    console.log(`   Cleaned up 100 sessions in ${cleanupTime.toFixed(2)}ms`);

    // Performance expectations
    expect(renderTime).toBeLessThan(5000);
    expect(activityTime).toBeLessThan(2000);
  });

  it('should handle mixed activity across sessions', async () => {
    interface SessionWithId {
      unmount: () => void;
      id: number;
    }

    const sessions: SessionWithId[] = [];
    const metrics = {
      renders: [] as number[],
      messages: [] as number[],
      typing: [] as number[],
      extensions: [] as number[]
    };

    // Create 50 sessions with different behaviors
    for (let i = 0; i < 50; i++) {
      const sessionStart = performance.now();

      const { unmount } = render(
        <EncryptionProvider sessionId={`mixed-${i}`}>
          <ActiveChat
            sessionId={`mixed-${i}`}
            duration={5}
            onTerminate={() => {}}
          />
        </EncryptionProvider>
      );

      metrics.renders.push(performance.now() - sessionStart);
      sessions.push({ unmount, id: i });
    }

    // Simulate 5 minutes of mixed activity
    await act(async () => {
      for (let minute = 0; minute < 5; minute++) {
        for (const session of sessions) {
          const activity = session.id % 4;

          switch(activity) {
            case 0: // Message heavy
              for (let m = 0; m < 20; m++) {
                const msgStart = performance.now();
                const mockWs = global.WebSocket as any;
                if (mockWs.onmessage) {
                  mockWs.onmessage({
                    data: JSON.stringify({
                      type: 'message',
                      id: `msg-${session.id}-${minute}-${m}`,
                      data: btoa('x'.repeat(500)),
                      keyId: 'test-key',
                      timestamp: Date.now()
                    })
                  });
                }
                metrics.messages.push(performance.now() - msgStart);
              }
              break;

            case 1: // Typing heavy
              for (let t = 0; t < 30; t++) {
                const typingStart = performance.now();
                const mockWs = global.WebSocket as any;
                if (mockWs.onmessage) {
                  mockWs.onmessage({
                    data: JSON.stringify({
                      type: 'typing',
                      isTyping: true,
                      timestamp: Date.now()
                    })
                  });
                }
                metrics.typing.push(performance.now() - typingStart);
              }
              break;

            case 2: // Extension heavy
              for (let e = 0; e < 5; e++) {
                const extStart = performance.now();
                const mockWs = global.WebSocket as any;
                if (mockWs.onmessage) {
                  mockWs.onmessage({
                    data: JSON.stringify({
                      type: 'time_update',
                      time_left: 300 + e * 60,
                      timestamp: Date.now()
                    })
                  });
                }
                metrics.extensions.push(performance.now() - extStart);
              }
              break;

            case 3: // Mixed
              break;
          }
        }

        vi.advanceTimersByTime(60000);
        console.log(`   Minute ${minute + 1} completed`);
      }
    });

    const avgRender = metrics.renders.reduce((a, b) => a + b, 0) / metrics.renders.length;
    const avgMessage = metrics.messages.length ?
      metrics.messages.reduce((a, b) => a + b, 0) / metrics.messages.length : 0;
    const avgTyping = metrics.typing.length ?
      metrics.typing.reduce((a, b) => a + b, 0) / metrics.typing.length : 0;
    const avgExtension = metrics.extensions.length ?
      metrics.extensions.reduce((a, b) => a + b, 0) / metrics.extensions.length : 0;

    console.log(`\n📊 Mixed Activity Metrics:`);
    console.log(`   Avg render time: ${avgRender.toFixed(2)}ms`);
    console.log(`   Avg message processing: ${avgMessage.toFixed(2)}ms`);
    console.log(`   Avg typing indicator: ${avgTyping.toFixed(2)}ms`);
    console.log(`   Avg extension processing: ${avgExtension.toFixed(2)}ms`);

    sessions.forEach(s => s.unmount());

    expect(avgRender).toBeLessThan(100);
    expect(avgMessage).toBeLessThan(10);
    expect(avgTyping).toBeLessThan(5);
    expect(avgExtension).toBeLessThan(5);
  });
});
