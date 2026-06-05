import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useThreads } from '../hooks/useThreads';
import type { Thread, Project } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusDot = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-500';
    case 'paused': return 'bg-amber-500';
    case 'completed': return 'bg-blue-500';
    case 'aborted': return 'bg-red-500';
    default: return 'bg-slate-500';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Active';
    case 'paused': return 'Paused';
    case 'completed': return 'Completed';
    case 'aborted': return 'Aborted';
    default: return status;
  }
};

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface ThreadItemProps {
  thread: Thread;
  project: Project | undefined;
  isActive: boolean;
  onClick: () => void;
  onTogglePin: () => void;
}

function ThreadItem({ thread, isActive, onClick, onTogglePin }: ThreadItemProps) {
  const [showPin, setShowPin] = useState(false);
  const isPinned = thread.is_pinned === '1';

  return (
    <li
      onMouseEnter={() => setShowPin(true)}
      onMouseLeave={() => setShowPin(false)}
    >
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-3 py-2 rounded-card transition-all duration-150',
          isActive
            ? 'bg-bmad-surface-raised border-l-[3px] border-bmad-primary shadow-bmad-sm'
            : 'hover:bg-bmad-surface-raised/60 border-l-[3px] border-transparent'
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full shrink-0', statusDot(thread.status))} />
          <span className="truncate flex-1 text-body">{thread.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
            className={cn(
              'shrink-0 transition-opacity duration-150',
              isPinned ? 'opacity-100 text-amber-400' : showPin ? 'opacity-60 text-bmad-muted hover:text-amber-400' : 'opacity-0'
            )}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-0.5 pl-4">
          <span className="text-[10px] text-bmad-muted">{statusLabel(thread.status)}</span>
          <span className="text-[10px] text-bmad-muted">·</span>
          <span className="text-[10px] text-bmad-muted">{relativeTime(thread.updated_at)}</span>
        </div>
      </button>
    </li>
  );
}

interface SectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function Section({ title, count, children, defaultExpanded = true }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-2 py-1.5 text-label text-bmad-muted uppercase hover:text-bmad-text transition-colors"
      >
        <span>{title} <span className="text-bmad-muted/60">({count})</span></span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn('transition-transform duration-200', expanded ? 'rotate-180' : '')}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {expanded && <ul className="space-y-0.5 mt-1">{children}</ul>}
    </div>
  );
}

export default function ThreadNavigator() {
  const {
    projects, threads, activeThreadId, layout, setActiveThread, setLayout,
    setProjects, setThreads, addThread, addProject
  } = useAppStore();
  const { loading, error, createThread, createProject } = useThreads();

  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadIntent, setNewThreadIntent] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load data into store
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadError(null);
        const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';
        const projResp = await fetch(`${API_BASE}/api/projects`);
        if (!projResp.ok) {
          const errText = await projResp.text().catch(() => 'Unknown error');
          throw new Error(`Failed to fetch projects (${projResp.status}): ${errText}`);
        }
        const projs = await projResp.json();
        setProjects(projs);
        const allThreads: Thread[] = [];
        for (const proj of projs) {
          const tResp = await fetch(`${API_BASE}/api/threads/by-project/${proj.id}`);
          if (tResp.ok) {
            const t = await tResp.json();
            allThreads.push(...t);
          }
        }
        setThreads(allThreads);
        if (allThreads.length > 0 && !activeThreadId) {
          setActiveThread(allThreads[0].id);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load data';
        console.warn('Failed to load threads:', err);
        setLoadError(msg);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut: / focuses search
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredThreads = useMemo(() => {
    let result = threads;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        projects.find((p) => p.id === t.project_id)?.name.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    return result;
  }, [threads, searchQuery, statusFilter, projects]);

  const pinnedThreads = useMemo(() => filteredThreads.filter((t) => t.is_pinned === '1'), [filteredThreads]);
  const activeThreads = useMemo(() => filteredThreads.filter((t) => t.status === 'active' || t.status === 'paused'), [filteredThreads]);
  const completedThreads = useMemo(() => filteredThreads.filter((t) => t.status === 'completed'), [filteredThreads]);

  const handleTogglePin = useCallback(async (thread: Thread) => {
    const newPinned = thread.is_pinned === '1' ? '0' : '1';
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';
      await fetch(`${API_BASE}/api/threads/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: newPinned }),
      });
      setThreads(threads.map((t) => t.id === thread.id ? { ...t, is_pinned: newPinned } : t));
    } catch (err) {
      console.warn('Failed to toggle pin:', err);
    }
  }, [threads, setThreads]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = layout.leftWidth;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(400, startWidth + e.clientX - startX));
      setLayout({ leftWidth: newWidth });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !selectedProjectId) return;
    setIsCreating(true);
    try {
      const thread = await createThread(selectedProjectId, newThreadTitle.trim(), newThreadIntent.trim() || undefined);
      addThread(thread);
      setActiveThread(thread.id);
      setShowNewThreadForm(false);
      setNewThreadTitle('');
      setNewThreadIntent('');
    } catch (err) {
      alert('Failed to create thread');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      const project = await createProject(newProjectName.trim());
      addProject(project);
      setShowNewProjectForm(false);
      setNewProjectName('');
      setSelectedProjectId(project.id);
    } catch (err) {
      alert('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const renderThreadItem = (thread: Thread) => (
    <ThreadItem
      key={thread.id}
      thread={thread}
      project={projects.find((p) => p.id === thread.project_id)}
      isActive={activeThreadId === thread.id}
      onClick={() => setActiveThread(thread.id)}
      onTogglePin={() => handleTogglePin(thread)}
    />
  );

  return (
    <aside
      className="relative flex flex-col border-r border-bmad-border bg-bmad-surface shrink-0"
      style={{ width: layout.leftWidth }}
      data-testid="thread-navigator"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bmad-border">
        <h2 className="text-heading text-bmad-text font-semibold">Threads</h2>
        <button
          className="text-caption bg-bmad-primary hover:bg-bmad-primary-light text-white px-3 py-1.5 rounded-button transition-all shadow-bmad-sm hover:shadow-bmad-md"
          onClick={() => setShowNewThreadForm(true)}
          data-testid="new-thread-btn"
        >
          New Thread
        </button>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 border-b border-bmad-border">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bmad-muted"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads… (/)"
            className="w-full bg-bmad-bg border border-bmad-border rounded-button pl-8 pr-8 py-1.5 text-caption text-bmad-text placeholder:text-bmad-muted/60 focus:outline-none focus:border-bmad-primary/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-bmad-muted hover:text-bmad-text"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status filter chips */}
        <div className="flex gap-1.5 mt-2">
          {(['all', 'active', 'paused', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all',
                statusFilter === s
                  ? 'bg-bmad-primary/20 text-bmad-primary-light border-bmad-primary/30'
                  : 'bg-transparent text-bmad-muted border-bmad-border hover:text-bmad-text'
              )}
            >
              {s === 'all' ? 'All' : statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="px-4 py-3 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: `${i * 20}ms` }}>
              <div className="w-2 h-2 rounded-full bg-bmad-border animate-shimmer" />
              <div className="flex-1 h-4 bg-bmad-border rounded animate-shimmer" />
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="px-4 py-2 text-caption text-status-error">{error}</div>
      )}

      {/* Thread sections */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {/* Error state */}
        {loadError && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-12 h-12 rounded-panel bg-red-500/10 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
                <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
              </svg>
            </div>
            <h3 className="text-body font-semibold text-bmad-text mb-1">Failed to load projects</h3>
            <p className="text-caption text-bmad-muted mb-4">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-caption bg-bmad-primary hover:bg-bmad-primary-light text-white px-4 py-2 rounded-button transition-all shadow-bmad-sm"
            >
              Retry
            </button>
          </div>
        )}

        {!loadError && !loading && threads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-12 h-12 rounded-panel bg-bmad-surface-raised flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-bmad-muted">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <h3 className="text-body font-semibold text-bmad-text mb-1">Welcome to BMAD Stream Workbench</h3>
            <p className="text-caption text-bmad-muted mb-4">Create your first project to start generating PRDs with AI</p>
            <button
              onClick={() => {
                setShowNewThreadForm(true);
                setShowNewProjectForm(true);
                setSelectedProjectId('');
              }}
              className="text-caption bg-bmad-primary hover:bg-bmad-primary-light text-white px-4 py-2 rounded-button transition-all shadow-bmad-sm"
            >
              Create Project
            </button>
          </div>
        )}

        {!loading && threads.length > 0 && filteredThreads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <p className="text-caption text-bmad-muted">No threads match your search</p>
          </div>
        )}

        {pinnedThreads.length > 0 && (
          <Section title="Pinned" count={pinnedThreads.length} defaultExpanded={true}>
            {pinnedThreads.map(renderThreadItem)}
          </Section>
        )}

        {activeThreads.length > 0 && (
          <Section title="Active" count={activeThreads.length} defaultExpanded={true}>
            {activeThreads.map(renderThreadItem)}
          </Section>
        )}

        {completedThreads.length > 0 && (
          <Section title="Completed" count={completedThreads.length} defaultExpanded={false}>
            {completedThreads.map(renderThreadItem)}
          </Section>
        )}

        {/* By Project view (when no search/filter) */}
        {searchQuery === '' && statusFilter === 'all' && (
          <div className="mt-2">
            {projects.map((project) => {
              const projectThreads = threads.filter((t) => t.project_id === project.id);
              if (projectThreads.length === 0) return null;

              return (
                <Section key={project.id} title={project.name} count={projectThreads.length} defaultExpanded={true}>
                  {projectThreads.map(renderThreadItem)}
                </Section>
              );
            })}
          </div>
        )}
      </div>

      {/* New thread modal */}
      {showNewThreadForm && (
        <div className="absolute inset-0 bg-bmad-bg/95 backdrop-blur-sm z-20 flex flex-col p-4 rounded-panel">
          <h3 className="text-heading text-bmad-text font-semibold mb-4">New Thread</h3>

          {!showNewProjectForm ? (
            <>
              <label className="text-caption text-bmad-muted mb-1">Project</label>
              <select
                className="bg-bmad-surface-raised border border-bmad-border rounded-button px-3 py-2 text-body text-bmad-text mb-3 focus:outline-none focus:border-bmad-primary/50"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                data-testid="project-select"
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                className="text-caption text-bmad-primary hover:text-bmad-primary-light mb-3 text-left transition-colors"
                onClick={() => setShowNewProjectForm(true)}
              >
                + Create new project
              </button>
            </>
          ) : (
            <>
              <label className="text-caption text-bmad-muted mb-1">New Project Name</label>
              <input
                type="text"
                className="bg-bmad-surface-raised border border-bmad-border rounded-button px-3 py-2 text-body text-bmad-text mb-2 focus:outline-none focus:border-bmad-primary/50"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                data-testid="new-project-input"
              />
              <div className="flex gap-2 mb-3">
                <button
                  className="text-caption bg-bmad-primary hover:bg-bmad-primary-light text-white px-3 py-1.5 rounded-button transition-all"
                  onClick={handleCreateProject}
                  disabled={isCreating}
                >
                  Create Project
                </button>
                <button
                  className="text-caption text-bmad-muted hover:text-bmad-text px-3 py-1.5 transition-colors"
                  onClick={() => setShowNewProjectForm(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          <label className="text-caption text-bmad-muted mb-1">Title</label>
          <input
            type="text"
            className="bg-bmad-surface-raised border border-bmad-border rounded-button px-3 py-2 text-body text-bmad-text mb-3 focus:outline-none focus:border-bmad-primary/50"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            placeholder="Thread title"
            data-testid="new-thread-title"
          />

          <label className="text-caption text-bmad-muted mb-1">Initial Intent (optional)</label>
          <textarea
            className="bg-bmad-surface-raised border border-bmad-border rounded-button px-3 py-2 text-body text-bmad-text mb-3 resize-none focus:outline-none focus:border-bmad-primary/50"
            rows={3}
            value={newThreadIntent}
            onChange={(e) => setNewThreadIntent(e.target.value)}
            placeholder="What should I work on?"
            data-testid="new-thread-intent"
          />

          <div className="flex gap-2 mt-auto">
            <button
              className="flex-1 bg-bmad-primary hover:bg-bmad-primary-light disabled:bg-bmad-surface-raised disabled:text-bmad-muted text-white px-4 py-2 rounded-button text-body font-medium transition-all shadow-bmad-sm"
              onClick={handleCreateThread}
              disabled={!newThreadTitle.trim() || !selectedProjectId || isCreating}
              data-testid="create-thread-submit"
            >
              {isCreating ? 'Creating…' : 'Create Thread'}
            </button>
            <button
              className="text-caption text-bmad-muted hover:text-bmad-text px-4 py-2 transition-colors"
              onClick={() => {
                setShowNewThreadForm(false);
                setShowNewProjectForm(false);
                setNewThreadTitle('');
                setNewThreadIntent('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-bmad-primary/50 transition-colors"
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}
