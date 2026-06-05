import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ThreadNavigator from '../src/components/ThreadNavigator';

const mockProjects = [
  { id: 'proj-1', name: 'Lifetech R&D' },
];

const mockThreads = [
  { id: 'thread-1', project_id: 'proj-1', title: 'Q3 Requirements PRD', status: 'active', is_pinned: '0', created_by: 'user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

describe('ThreadNavigator', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/projects')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProjects) } as Response);
      }
      if (url.includes('/api/threads/by-project/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockThreads) } as Response);
      }
      if (url.includes('/api/threads') && url.includes('/api/threads/by-project') === false) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'thread-new',
            project_id: 'proj-1',
            title: 'New Thread',
            status: 'active',
            is_pinned: '0',
            created_by: 'user-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders and loads threads', async () => {
    render(<ThreadNavigator />);
    await waitFor(() => {
      expect(screen.getAllByText('Q3 Requirements PRD').length).toBeGreaterThan(0);
    });
  });

  it('opens new thread form when New Thread clicked', async () => {
    render(<ThreadNavigator />);
    await waitFor(() => screen.getAllByText('Q3 Requirements PRD'));
    fireEvent.click(screen.getByTestId('new-thread-btn'));
    expect(screen.getByTestId('new-thread-title')).toBeInTheDocument();
  });

  it('allows creating a thread', async () => {
    render(<ThreadNavigator />);
    await waitFor(() => screen.getAllByText('Q3 Requirements PRD'));
    fireEvent.click(screen.getByTestId('new-thread-btn'));

    const titleInput = screen.getByTestId('new-thread-title');
    fireEvent.change(titleInput, { target: { value: 'New Thread' } });

    const select = screen.getByTestId('project-select');
    fireEvent.change(select, { target: { value: 'proj-1' } });

    fireEvent.click(screen.getByTestId('create-thread-submit'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/threads'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
