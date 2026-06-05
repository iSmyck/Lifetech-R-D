import { useState, useEffect, useCallback } from 'react';
import type { Resource, ResourceSearchResult } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function useResources(threadId: string | null) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ResourceSearchResult[]>([]);

  const fetchResources = useCallback(async () => {
    if (!threadId) {
      setResources([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/threads/${threadId}/resources`);
      if (resp.ok) {
        const data = await resp.json();
        setResources(data);
      }
    } catch (err) {
      console.warn('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const searchResources = useCallback(async (query: string, type: 'jira' | 'confluence') => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const endpoint = type === 'jira' ? '/api/integrations/jira/search' : '/api/integrations/confluence/search';
      const resp = await fetch(`${API_BASE}${endpoint}?q=${encodeURIComponent(query)}&limit=10`);
      if (resp.ok) {
        const data = await resp.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.warn('Failed to search resources:', err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const linkResource = useCallback(async (payload: {
    type: 'jira' | 'confluence';
    external_id: string;
    title: string;
    status?: string | null;
    url?: string | null;
    include_in_ai_context?: boolean;
  }) => {
    if (!threadId) return null;
    try {
      const resp = await fetch(`${API_BASE}/api/threads/${threadId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const data = await resp.json();
        setResources((prev) => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.warn('Failed to link resource:', err);
    }
    return null;
  }, [threadId]);

  const unlinkResource = useCallback(async (resourceId: string) => {
    if (!threadId) return false;
    try {
      const resp = await fetch(`${API_BASE}/api/threads/${threadId}/resources/${resourceId}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        setResources((prev) => prev.filter((r) => r.id !== resourceId));
        return true;
      }
    } catch (err) {
      console.warn('Failed to unlink resource:', err);
    }
    return false;
  }, [threadId]);

  return {
    resources,
    loading,
    searchLoading,
    searchResults,
    setSearchResults,
    fetchResources,
    searchResources,
    linkResource,
    unlinkResource,
  };
}
