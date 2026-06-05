import { useState, useEffect, useCallback } from 'react';

export interface StakeholderUser {
  id: string;
  display_name: string;
  email: string;
  department: string;
}

export interface Stakeholder {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'accountable' | 'responsible' | 'consulted' | 'informed';
  added_by: string;
  added_at: string;
  user?: StakeholderUser;
}

export interface Review {
  id: string;
  thread_id: string;
  document_id: string;
  reviewer_id: string;
  status: 'pending' | 'approved' | 'changes_requested';
  comment?: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: StakeholderUser;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function useStakeholders(threadId: string | null) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStakeholders = useCallback(async () => {
    if (!threadId) {
      setStakeholders([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/threads/${threadId}/stakeholders`);
      if (resp.ok) {
        const data = await resp.json();
        setStakeholders(data);
      }
    } catch (err) {
      console.warn('Failed to fetch stakeholders:', err);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchStakeholders();
  }, [fetchStakeholders]);

  const addStakeholder = useCallback(async (userId: string, role: string) => {
    if (!threadId) return null;
    try {
      const resp = await fetch(`${API_BASE}/api/threads/${threadId}/stakeholders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setStakeholders((prev) => [...prev, data]);
        return data;
      }
    } catch (err) {
      console.warn('Failed to add stakeholder:', err);
    }
    return null;
  }, [threadId]);

  const updateRole = useCallback(async (userId: string, role: string) => {
    if (!threadId) return null;
    try {
      const resp = await fetch(`${API_BASE}/api/threads/${threadId}/stakeholders/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setStakeholders((prev) =>
          prev.map((s) => (s.user_id === userId ? data : s))
        );
        return data;
      }
    } catch (err) {
      console.warn('Failed to update role:', err);
    }
    return null;
  }, [threadId]);

  const removeStakeholder = useCallback(async (userId: string) => {
    if (!threadId) return false;
    try {
      const resp = await fetch(`${API_BASE}/api/threads/${threadId}/stakeholders/${userId}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        setStakeholders((prev) => prev.filter((s) => s.user_id !== userId));
        return true;
      }
    } catch (err) {
      console.warn('Failed to remove stakeholder:', err);
    }
    return false;
  }, [threadId]);

  return {
    stakeholders,
    loading,
    fetchStakeholders,
    addStakeholder,
    updateRole,
    removeStakeholder,
  };
}

export function useReviews(documentId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!documentId) {
      setReviews([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/documents/${documentId}/reviews`);
      if (resp.ok) {
        const data = await resp.json();
        setReviews(data);
      }
    } catch (err) {
      console.warn('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const requestReview = useCallback(async (reviewerIds: string[], message?: string) => {
    if (!documentId) return null;
    try {
      const resp = await fetch(`${API_BASE}/api/documents/${documentId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_ids: reviewerIds, message }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setReviews((prev) => [...data, ...prev]);
        return data;
      }
    } catch (err) {
      console.warn('Failed to request review:', err);
    }
    return null;
  }, [documentId]);

  return {
    reviews,
    loading,
    fetchReviews,
    requestReview,
  };
}
