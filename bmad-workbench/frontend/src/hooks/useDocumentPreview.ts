import { useEffect, useState, useCallback } from 'react';
import type { DocumentDetail } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function useDocumentPreview(threadId: string | null) {
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/api/documents/${id}`);
      if (!resp.ok) throw new Error('Document not found');
      const data = (await resp.json()) as DocumentDetail;
      setDocument(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDocument(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!threadId) {
      setDocument(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function findAndLoad() {
      try {
        // Fetch documents for this thread
        const resp = await fetch(`${API_BASE}/api/threads/${threadId}/documents`);
        if (!resp.ok) throw new Error('Failed to fetch thread documents');
        const docs = (await resp.json()) as Array<{ id: string }>;
        if (docs.length > 0 && !cancelled) {
          await loadDocument(docs[0].id);
        } else if (!cancelled) {
          setDocument(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    }

    findAndLoad();
    return () => {
      cancelled = true;
    };
  }, [threadId, loadDocument]);

  return { document, loading, error, loadDocument };
}
