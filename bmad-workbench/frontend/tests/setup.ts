import '@testing-library/jest-dom';

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Minimal EventSource mock for jsdom
class MockEventSource {
  url: string;
  onopen: ((this: EventSource, ev: Event) => void) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent) => void) | null = null;
  onerror: ((this: EventSource, ev: Event) => void) | null = null;
  readyState = 0;
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;
  constructor(url: string | URL) {
    this.url = String(url);
  }
  addEventListener() {}
  removeEventListener() {}
  close() {
    this.readyState = 2;
  }
}

(globalThis as any).EventSource = MockEventSource;
