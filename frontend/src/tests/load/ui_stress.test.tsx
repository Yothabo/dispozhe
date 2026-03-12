import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActiveChat from '../../components/chat/ActiveChat';
import { EncryptionProvider } from '../../contexts/WebSocketContext';

class MockWebSocket {
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onopen: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
}

global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

describe('UI Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should handle rapid message typing and sending', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <EncryptionProvider sessionId="test-session">
        <ActiveChat sessionId="test-session" duration={5} onTerminate={() => {}} />
      </EncryptionProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    const input = await screen.findByPlaceholderText(/type your message/i);

    for (let i = 0; i < 100; i++) {
      await user.type(input, 'a');
    }

    expect(input).toHaveValue('a'.repeat(100));

    const sendButton = screen.getByTitle('Send message');
    await user.click(sendButton);
    expect(sendButton).toBeDisabled();
  });

  it('should handle 1000 messages in quick succession', async () => {
    render(
      <EncryptionProvider sessionId="test-session">
        <ActiveChat sessionId="test-session" duration={5} onTerminate={() => {}} />
      </EncryptionProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    for (let i = 0; i < 1000; i++) {
      const mockWs = global.WebSocket as unknown as MockWebSocket;
      if (mockWs.onmessage) {
        mockWs.onmessage({
          data: JSON.stringify({
            type: 'message',
            id: `msg-${i}`,
            data: btoa(`encrypted-${i}`),
            keyId: 'test-key',
            timestamp: Date.now()
          })
        });
      }

      if (i % 100 === 0) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(10);
        });
      }
    }

    const messageElements = await screen.findAllByTestId(/message-bubble/);
    expect(messageElements.length).toBeGreaterThan(0);
  });

  it('should handle rapid window resizing', async () => {
    render(
      <EncryptionProvider sessionId="test-session">
        <ActiveChat sessionId="test-session" duration={5} onTerminate={() => {}} />
      </EncryptionProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    for (let i = 0; i < 100; i++) {
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
    }

    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
  });

  it('should handle rapid timer updates', async () => {
    render(
      <EncryptionProvider sessionId="test-session">
        <ActiveChat sessionId="test-session" duration={5} onTerminate={() => {}} />
      </EncryptionProvider>
    );

    for (let i = 0; i < 1000; i++) {
      act(() => {
        vi.advanceTimersByTime(1);
      });
    }

    const timerElement = await screen.findByText(/:/);
    expect(timerElement).toBeInTheDocument();
  });

  it('should handle rapid component mount/unmount cycles', async () => {
    const mountTime: number[] = [];

    for (let cycle = 0; cycle < 50; cycle++) {
      const start = performance.now();

      const { unmount } = render(
        <EncryptionProvider sessionId={`test-session-${cycle}`}>
          <ActiveChat sessionId={`test-session-${cycle}`} duration={5} onTerminate={() => {}} />
        </EncryptionProvider>
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      mountTime.push(performance.now() - start);
      unmount();
    }

    const avgMount = mountTime.reduce((a, b) => a + b, 0) / mountTime.length;
    expect(avgMount).toBeLessThan(100);
  });
});
