import { render, screen, waitFor, within } from '@testing-library/react';
import App from '../src/App';

const mockProjects = [
  { id: 'proj-1', name: 'Lifetech R&D' },
];

const mockThreads = [
  { id: 'thread-1', project_id: 'proj-1', title: 'Q3 Requirements PRD', status: 'active', is_pinned: '0', created_by: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'thread-2', project_id: 'proj-1', title: 'API Gateway Spec', status: 'paused', is_pinned: '0', created_by: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

describe('App', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/projects')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProjects) } as Response);
      }
      if (url.includes('/api/threads/by-project/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockThreads) } as Response);
      }
      if (url.includes('/api/notifications/unread-count')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ count: 0 }) } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the three-pane layout', async () => {
    render(<App />);
    expect(screen.getByTestId('thread-navigator')).toBeInTheDocument();
    expect(screen.getByTestId('stream-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel')).toBeInTheDocument();
  });

  it('shows thread list in navigator after loading', async () => {
    render(<App />);
    const navigator = screen.getByTestId('thread-navigator');
    await waitFor(() => {
      expect(within(navigator).getAllByText('Q3 Requirements PRD').length).toBeGreaterThan(0);
    });
    expect(within(navigator).getAllByText('API Gateway Spec').length).toBeGreaterThan(0);
  });

  it('shows intent bar in stream canvas', () => {
    render(<App />);
    expect(screen.getByTestId('intent-bar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What should I work on?')).toBeInTheDocument();
  });
});
