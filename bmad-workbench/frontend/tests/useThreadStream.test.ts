import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useThreadStream } from '../src/hooks/useThreadStream';
import { useAppStore } from '../src/store/useAppStore';

class MockEventSource {
  url: string;
  onopen: ((this: EventSource, ev: Event) => void) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent) => void) | null = null;
  onerror: ((this: EventSource, ev: Event) => void) | null = null;
  private listeners: Map<string, Array<(ev: MessageEvent) => void>> = new Map();
  readyState = 0;
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;

  constructor(url: string | URL) {
    this.url = String(url);
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen.call(this as unknown as EventSource, new Event('open'));
    }, 10);
  }

  addEventListener(type: string, handler: (ev: MessageEvent) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(handler);
  }

  removeEventListener(type: string, handler: (ev: MessageEvent) => void) {
    const handlers = this.listeners.get(type) || [];
    this.listeners.set(
      type,
      handlers.filter((h) => h !== handler)
    );
  }

  dispatchEvent(type: string, data: string, lastEventId = '') {
    const event = new MessageEvent(type, { data, lastEventId });
    if (type === 'message' && this.onmessage) {
      this.onmessage.call(this as unknown as EventSource, event);
    }
    const handlers = this.listeners.get(type) || [];
    handlers.forEach((h) => h(event));
  }

  close() {
    this.readyState = 2;
  }
}

let currentMockES: MockEventSource | null = null;

describe('useThreadStream', () => {
  beforeAll(() => {
    (globalThis as any).EventSource = vi.fn((url: string) => {
      currentMockES = new MockEventSource(url);
      return currentMockES;
    });
  });

  beforeEach(() => {
    useAppStore.setState({
      streamCards: [],
      isGenerating: false,
      reasoningText: '',
    });
    currentMockES = null;
  });

  it('connects to SSE endpoint when threadId is provided', async () => {
    renderHook(() => useThreadStream('thread-1'));
    await waitFor(() => {
      expect(currentMockES).not.toBeNull();
      expect(currentMockES!.url).toContain('/api/threads/thread-1/stream');
    });
  });

  it('does not connect when threadId is null', () => {
    renderHook(() => useThreadStream(null));
    expect(currentMockES).toBeNull();
  });

  it('updates generating state on reasoning_token', async () => {
    renderHook(() => useThreadStream('thread-1'));
    await waitFor(() => expect(currentMockES).not.toBeNull());

    currentMockES!.dispatchEvent('reasoning_token', JSON.stringify({ text: 'Analyzing…' }));

    await waitFor(() => {
      expect(useAppStore.getState().isGenerating).toBe(true);
      expect(useAppStore.getState().reasoningText).toBe('Analyzing…');
    });
  });

  it('appends draft card on draft_complete', async () => {
    renderHook(() => useThreadStream('thread-1'));
    await waitFor(() => expect(currentMockES).not.toBeNull());

    currentMockES!.dispatchEvent('draft_complete', JSON.stringify({ text: '# Draft' }));

    await waitFor(() => {
      const cards = useAppStore.getState().streamCards;
      expect(cards.length).toBe(1);
      expect(cards[0].card_type).toBe('draft');
    });
  });

  it('appends checkpoint card on checkpoint_pause', async () => {
    renderHook(() => useThreadStream('thread-1'));
    await waitFor(() => expect(currentMockES).not.toBeNull());

    currentMockES!.dispatchEvent('checkpoint_pause', JSON.stringify({ message: 'Wait' }));

    await waitFor(() => {
      const cards = useAppStore.getState().streamCards;
      expect(cards.some((c) => c.card_type === 'checkpoint_clarification')).toBe(true);
    });
  });

  it('appends approval card on approval_recorded', async () => {
    renderHook(() => useThreadStream('thread-1'));
    await waitFor(() => expect(currentMockES).not.toBeNull());

    currentMockES!.dispatchEvent('approval_recorded', JSON.stringify({ approved_by: 'user-1' }));

    await waitFor(() => {
      const cards = useAppStore.getState().streamCards;
      expect(cards.some((c) => c.card_type === 'approval')).toBe(true);
    });
  });

  it('appends checkpoint response card on human_input with checkpoint_id', async () => {
    renderHook(() => useThreadStream('thread-1'));
    await waitFor(() => expect(currentMockES).not.toBeNull());

    currentMockES!.dispatchEvent('human_input', JSON.stringify({ checkpoint_id: 'cp-1', response: 'Yes please', question: 'Should I include API specs?' }));

    await waitFor(() => {
      const cards = useAppStore.getState().streamCards;
      expect(cards.some((c) => c.card_type === 'checkpoint_response')).toBe(true);
      const responseCard = cards.find((c) => c.card_type === 'checkpoint_response');
      expect(responseCard?.content.response).toBe('Yes please');
    });
  });

  it('shows awaiting input text on checkpoint_pause', async () => {
    renderHook(() => useThreadStream('thread-1'));
    await waitFor(() => expect(currentMockES).not.toBeNull());

    currentMockES!.dispatchEvent('checkpoint_pause', JSON.stringify({ message: 'Awaiting human input', question: 'Q?' }));

    await waitFor(() => {
      expect(useAppStore.getState().reasoningText).toBe('Awaiting your input…');
    });
  });

  it('reconnects on error with exponential backoff', async () => {
    renderHook(() => useThreadStream('thread-1'));
    await waitFor(() => expect(currentMockES).not.toBeNull());

    const firstES = currentMockES;
    // Simulate error
    if (firstES!.onerror) firstES!.onerror.call(firstES as unknown as EventSource, new Event('error'));

    // Wait for reconnect (initial delay is 1000ms)
    await new Promise((r) => setTimeout(r, 1200));

    await waitFor(() => {
      expect(currentMockES).not.toBeNull();
      expect(currentMockES).not.toBe(firstES);
    });
  }, 10000);
});
