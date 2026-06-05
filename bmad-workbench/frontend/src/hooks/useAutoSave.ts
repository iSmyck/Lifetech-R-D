import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_PREFIX = 'bmad:draft';

interface AutoSaveState {
  hasRecovery: boolean;
  recoveredContent: string | null;
  recoveredTitle: string | null;
  clearRecovery: () => void;
}

function getStorageKey(threadId: string, documentId: string): string {
  return `${STORAGE_PREFIX}:${threadId}:${documentId}`;
}

interface SavedDraft {
  content: string;
  title: string;
  timestamp: number;
}

export function useAutoSave(
  threadId: string | null,
  documentId: string | null,
  content: string,
  title: string
): AutoSaveState {
  const [hasRecovery, setHasRecovery] = useState(false);
  const [recoveredContent, setRecoveredContent] = useState<string | null>(null);
  const [recoveredTitle, setRecoveredTitle] = useState<string | null>(null);
  const lastSavedRef = useRef<number>(0);
  const contentRef = useRef(content);
  const titleRef = useRef(title);

  // Keep refs in sync
  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { titleRef.current = title; }, [title]);

  // Check for recovery on mount
  useEffect(() => {
    if (!threadId || !documentId) {
      setHasRecovery(false);
      return;
    }
    try {
      const key = getStorageKey(threadId, documentId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved: SavedDraft = JSON.parse(raw);
        // Only offer recovery if saved within last 7 days
        const ageMs = Date.now() - saved.timestamp;
        if (ageMs < 7 * 24 * 60 * 60 * 1000) {
          setRecoveredContent(saved.content);
          setRecoveredTitle(saved.title);
          setHasRecovery(true);
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [threadId, documentId]);

  // Auto-save every 30s
  useEffect(() => {
    if (!threadId || !documentId) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Only save if content changed since last save
      if (now - lastSavedRef.current < 30000) return;

      try {
        const key = getStorageKey(threadId, documentId);
        const payload: SavedDraft = {
          content: contentRef.current,
          title: titleRef.current,
          timestamp: now,
        };
        localStorage.setItem(key, JSON.stringify(payload));
        lastSavedRef.current = now;
      } catch {
        // ignore storage errors (e.g. quota exceeded)
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [threadId, documentId]);

  // Also save on unmount
  useEffect(() => {
    return () => {
      if (!threadId || !documentId) return;
      try {
        const key = getStorageKey(threadId, documentId);
        const payload: SavedDraft = {
          content: contentRef.current,
          title: titleRef.current,
          timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        // ignore
      }
    };
  }, [threadId, documentId]);

  const clearRecovery = useCallback(() => {
    if (threadId && documentId) {
      try {
        localStorage.removeItem(getStorageKey(threadId, documentId));
      } catch {
        // ignore
      }
    }
    setHasRecovery(false);
    setRecoveredContent(null);
    setRecoveredTitle(null);
  }, [threadId, documentId]);

  return { hasRecovery, recoveredContent, recoveredTitle, clearRecovery };
}
