import { useState, useCallback, useEffect } from 'react';
import type { Attachment } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

export function useAttachments(threadId: string | null) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const fetchAttachments = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/attachments/by-thread/${threadId}`);
      if (resp.ok) {
        const data = await resp.json();
        setAttachments(data);
      }
    } catch (err) {
      console.warn('Failed to fetch attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const uploadFile = useCallback(
    async (file: File, projectId: string) => {
      if (!threadId) return;

      const formData = new FormData();
      formData.append('thread_id', threadId);
      formData.append('project_id', projectId);
      formData.append('file', file);

      setUploads((prev) => [...prev, { file, progress: 0, status: 'uploading' }]);

      try {
        const resp = await fetch(`${API_BASE}/api/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (resp.ok) {
          setUploads((prev) =>
            prev.map((u) => (u.file === file ? { ...u, progress: 100, status: 'done' } : u))
          );
          await fetchAttachments();
        } else {
          setUploads((prev) =>
            prev.map((u) => (u.file === file ? { ...u, status: 'error' } : u))
          );
        }
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) => (u.file === file ? { ...u, status: 'error' } : u))
        );
      }

      // Remove completed upload after a delay
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.file !== file));
      }, 3000);
    },
    [threadId, fetchAttachments]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, projectId: string) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => uploadFile(file, projectId));
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return {
    attachments,
    loading,
    uploads,
    dragOver,
    fetchAttachments,
    uploadFile,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  };
}
