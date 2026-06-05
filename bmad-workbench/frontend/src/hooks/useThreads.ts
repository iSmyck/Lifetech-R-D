import { useEffect, useState, useCallback } from 'react';
import type { Project, Thread } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function useThreads() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/projects`);
      if (!resp.ok) throw new Error('Failed to fetch projects');
      const data = await resp.json();
      setProjects(data);
      return data as Project[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, []);

  const fetchThreadsForProject = useCallback(async (projectId: string) => {
    try {
      const resp = await fetch(`${API_BASE}/api/threads/by-project/${projectId}`);
      if (!resp.ok) throw new Error('Failed to fetch threads');
      const data = await resp.json();
      return data as Thread[];
    } catch (err) {
      console.warn('Failed to fetch threads for project', projectId, err);
      return [];
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const projs = await fetchProjects();
    const allThreads: Thread[] = [];
    for (const proj of projs) {
      const projThreads = await fetchThreadsForProject(proj.id);
      allThreads.push(...projThreads);
    }
    setThreads(allThreads);
    setLoading(false);
  }, [fetchProjects, fetchThreadsForProject]);

  const createThread = useCallback(
    async (projectId: string, title: string, initialIntent?: string) => {
      const resp = await fetch(`${API_BASE}/api/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, title, initial_intent: initialIntent }),
      });
      if (!resp.ok) throw new Error('Failed to create thread');
      const thread = (await resp.json()) as Thread;
      setThreads((prev) => [thread, ...prev]);
      return thread;
    },
    []
  );

  const createProject = useCallback(async (name: string, description?: string) => {
    const resp = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!resp.ok) throw new Error('Failed to create project');
    const project = (await resp.json()) as Project;
    setProjects((prev) => [project, ...prev]);
    return project;
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    projects,
    threads,
    loading,
    error,
    refresh: loadAll,
    createThread,
    createProject,
  };
}
