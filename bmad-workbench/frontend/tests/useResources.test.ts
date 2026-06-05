import { renderHook, waitFor } from '@testing-library/react';
import { useResources } from '../src/hooks/useResources';

describe('useResources', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty resources when no threadId', () => {
    const { result } = renderHook(() => useResources(null));
    expect(result.current.resources).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetches resources for a thread', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 'res-1',
              thread_id: 'thread-1',
              type: 'jira',
              external_id: 'PROD-442',
              title: 'OAuth integration',
              status: 'In Progress',
              url: 'https://jira.example.com/browse/PROD-442',
              metadata_json: null,
              include_in_ai_context: '1',
              created_at: new Date().toISOString(),
            },
          ]),
      } as Response)
    );

    const { result } = renderHook(() => useResources('thread-1'));

    await waitFor(() => {
      expect(result.current.resources.length).toBe(1);
    });
    expect(result.current.resources[0].external_id).toBe('PROD-442');
  });

  it('links a resource and updates state', async () => {
    global.fetch = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('/resources') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'res-2',
              thread_id: 'thread-1',
              type: 'jira',
              external_id: 'AUTH-42',
              title: 'Auth flow',
              status: 'Done',
              url: null,
              metadata_json: null,
              include_in_ai_context: '1',
              created_at: new Date().toISOString(),
            }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response);
    });

    const { result } = renderHook(() => useResources('thread-1'));

    await result.current.linkResource({
      type: 'jira',
      external_id: 'AUTH-42',
      title: 'Auth flow',
      status: 'Done',
      include_in_ai_context: true,
    });

    await waitFor(() => {
      expect(result.current.resources.length).toBe(1);
    });
    expect(result.current.resources[0].external_id).toBe('AUTH-42');
  });
});
