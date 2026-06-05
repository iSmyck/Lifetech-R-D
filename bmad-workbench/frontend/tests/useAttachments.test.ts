import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useAttachments } from '../src/hooks/useAttachments';

describe('useAttachments', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty attachments when no threadId', () => {
    const { result } = renderHook(() => useAttachments(null));
    expect(result.current.attachments).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetches attachments for a thread', async () => {
    const mockAttachments = [
      {
        id: 'a1',
        thread_id: 't1',
        project_id: 'p1',
        filename: 'test.txt',
        original_filename: 'test.txt',
        mime_type: 'text/plain',
        size_bytes: 100,
        status: 'ready',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttachments),
      })
    ) as any;

    const { result } = renderHook(() => useAttachments('t1'));

    await waitFor(() => {
      expect(result.current.attachments.length).toBe(1);
      expect(result.current.attachments[0].filename).toBe('test.txt');
    });
  });
});
