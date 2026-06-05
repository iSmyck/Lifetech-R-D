import { useRef, useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useThreadStream } from '../hooks/useThreadStream';
import { useBmadRegistry } from '../hooks/useBmadRegistry';
import { useDemoData } from '../hooks/useDemoData';
import StreamCard from './StreamCard';
import IntentBar from './IntentBar';
import AgentBadge from './AgentBadge';
import PhaseIndicator from './PhaseIndicator';
import AgentPicker from './AgentPicker';
import FocusedEditor from './FocusedEditor';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusConfig = (status: string) => {
  switch (status) {
    case 'active': return { dot: 'bg-emerald-500', label: 'Active', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    case 'paused': return { dot: 'bg-amber-500', label: 'Paused — Awaiting input', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
    case 'completed': return { dot: 'bg-blue-500', label: 'Completed', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
    case 'aborted': return { dot: 'bg-red-500', label: 'Aborted', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' };
    default: return { dot: 'bg-slate-500', label: status, bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
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
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function StreamCanvas() {
  const { streamCards, isGenerating, reasoningText, activeThreadId, threads, projects, layout, setLayout, bmadPhases, activeAgent, setActiveAgent, setBmadPhases, focusedEditor } = useAppStore();
  const isEditorOpen = focusedEditor?.isOpen ?? false;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJumpToLive, setShowJumpToLive] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const project = activeThread ? projects.find((p) => p.id === activeThread.project_id) : null;
  const status = activeThread ? statusConfig(activeThread.status) : null;

  const { agents, skills, getAgent } = useBmadRegistry();

  // Sync active agent from thread
  useEffect(() => {
    if (activeThread?.agent_id) {
      const agent = getAgent(activeThread.agent_id);
      if (agent) setActiveAgent(agent);
    } else {
      setActiveAgent(null);
    }
  }, [activeThread?.agent_id, getAgent, setActiveAgent]);

  // Sync phases from thread bmad_state
  useEffect(() => {
    if (activeThread?.bmad_state) {
      const completed = activeThread.bmad_state.phases_completed || [];
      const current = activeThread.bmad_state.current_phase || 'init';
      const skill = skills.find((s) => s.skill_id === activeThread.workflow_id);
      const phaseIds = skill?.phases?.length ? skill.phases : ['discovery', 'planning', 'drafting', 'review'];
      const phases = phaseIds.map((id) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
        description: `${id} phase`,
        status: (completed.includes(id) ? 'completed' : id === current ? 'current' : 'pending') as 'completed' | 'current' | 'pending',
      }));
      setBmadPhases(phases);
    } else {
      setBmadPhases([]);
    }
  }, [activeThread?.bmad_state, activeThread?.workflow_id, skills, setBmadPhases]);

  // Connect to SSE for the active thread
  useThreadStream(activeThreadId);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setShowJumpToLive(false);
      setIsAtBottom(true);
    }
  };

  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamCards, isAtBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
    setShowJumpToLive(!atBottom && streamCards.length > 0);
  };

  const { loadDemo } = useDemoData();

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = layout.rightWidth;

    const onMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX;
      const newWidth = Math.max(280, Math.min(600, startWidth + delta));
      setLayout({ rightWidth: newWidth });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Progress steps for reasoning ribbon
  const progressSteps = useMemo(() => {
    if (!isGenerating || !reasoningText) return null;
    const text = reasoningText.toLowerCase();
    if (text.includes('finalizing') || text.includes('draft complete')) return { step: 4, total: 4, label: 'Finalizing…' };
    if (text.includes('drafting') || text.includes('synthesizing')) return { step: 3, total: 4, label: 'Drafting document…' };
    if (text.includes('researching') || text.includes('checking') || text.includes('referencing')) return { step: 2, total: 4, label: 'Researching context…' };
    return { step: 1, total: 4, label: 'Analyzing requirements…' };
  }, [isGenerating, reasoningText]);

  return (
    <main className="flex-1 flex flex-col min-w-0 relative" data-testid="stream-canvas">
      {/* Rich Thread Header */}
      <div className="shrink-0 border-b border-bmad-border bg-bmad-surface">
        {activeThread ? (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-caption shrink-0">
                  <button className="text-bmad-muted hover:text-bmad-text transition-colors truncate max-w-[100px]">
                    {project?.name || 'Project'}
                  </button>
                  <span className="text-bmad-muted">/</span>
                </div>
                <h1 className="text-heading text-bmad-text font-semibold truncate">
                  {activeThread.title}
                </h1>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Agent badge */}
                <AgentBadge
                  agent={activeAgent}
                  onChangeAgent={() => setShowAgentPicker(true)}
                  size="sm"
                />

                {/* Status badge */}
                {status && (
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium', status.bg, status.text, status.border)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                    {status.label}
                  </span>
                )}

                {/* Actions dropdown placeholder */}
                <button className="p-1.5 rounded-button text-bmad-muted hover:text-bmad-text hover:bg-bmad-surface-raised transition-all" title="More actions">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Metadata bar */}
            <div className="flex items-center gap-4 mt-2 text-[11px] text-bmad-muted">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                Updated {relativeTime(activeThread.updated_at)}
              </span>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                {activeThread.created_by}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center px-4 py-3">
            <h1 className="text-heading text-bmad-text font-semibold">Select a thread</h1>
          </div>
        )}
      </div>

      {/* Phase Indicator */}
      {activeThread && bmadPhases.length > 0 && (
        <PhaseIndicator
          phases={bmadPhases}
          onPhaseClick={(phaseId) => {
            // Scroll to first card with this phase
            const el = document.querySelector(`[data-phase="${phaseId}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />
      )}

      {/* Enhanced Reasoning Ribbon */}
      {isGenerating && reasoningText && (
        <div className="px-4 py-2.5 bg-bmad-surface-raised/80 border-b border-bmad-border animate-breathe">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-bmad-primary animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-bmad-primary-light font-mono truncate">{reasoningText}</span>
                {progressSteps && (
                  <span className="text-[10px] text-bmad-muted shrink-0 ml-2">
                    Step {progressSteps.step}/{progressSteps.total}
                  </span>
                )}
              </div>
              {progressSteps && (
                <div className="w-full bg-bmad-border rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-bmad-primary to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(progressSteps.step / progressSteps.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cards area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          'flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 relative',
          isEditorOpen && 'overflow-hidden'
        )}
      >
        {isEditorOpen && (
          <div className="absolute inset-0 z-30 bg-bmad-bg/50 backdrop-blur-[2px]" />
        )}
        {!activeThreadId ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-panel bg-bmad-surface-raised flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-bmad-muted">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-heading text-bmad-text font-semibold mb-2">Select a thread to begin</h2>
            <p className="text-caption text-bmad-muted mb-4">Or create a new one from the sidebar</p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[data-testid="new-thread-btn"]')?.click()}
              className="text-caption bg-bmad-primary hover:bg-bmad-primary-light text-white px-4 py-2 rounded-button transition-all shadow-bmad-sm"
            >
              Create Thread
            </button>
          </div>
        ) : streamCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h2 className="text-heading text-bmad-text font-semibold mb-2">Ready to work</h2>
            <p className="text-caption text-bmad-muted mb-6">Choose a template or type your intent below</p>
            <button
              onClick={loadDemo}
              className="text-caption bg-bmad-primary/10 hover:bg-bmad-primary/20 text-bmad-primary px-4 py-2 rounded-button transition-all mb-6"
            >
              Load demo PRD draft
            </button>
            <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
              {[
                { icon: '📝', label: 'Draft PRD from scratch', desc: 'Start with a blank document' },
                { icon: '📋', label: 'Start from Jira ticket', desc: 'Import ticket details' },
                { icon: '📊', label: 'Summarize meeting notes', desc: 'Upload MoM file' },
                { icon: '🔄', label: 'Update existing document', desc: 'Refine current draft' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="flex flex-col items-center text-center p-4 rounded-card bg-bmad-surface-raised border border-bmad-border hover:border-bmad-primary/30 hover:shadow-bmad-sm transition-all group"
                  onClick={() => {
                    const input = document.querySelector<HTMLTextAreaElement>('[data-testid="intent-bar"] textarea');
                    if (input) input.focus();
                  }}
                >
                  <span className="text-2xl mb-2">{item.icon}</span>
                  <span className="text-caption text-bmad-text font-medium group-hover:text-bmad-primary-light transition-colors">{item.label}</span>
                  <span className="text-[10px] text-bmad-muted mt-1">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          streamCards.map((card, index) => (
            <div
              key={card.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <StreamCard card={card} />
            </div>
          ))
        )}
      </div>

      {/* Jump to live */}
      {showJumpToLive && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-bmad-primary hover:bg-bmad-primary-light text-white text-caption px-4 py-2 rounded-full shadow-bmad-lg transition-all"
        >
          Jump to live
        </button>
      )}

      {/* Agent Picker Modal */}
      {showAgentPicker && activeThread && (
        <AgentPicker
          agents={agents}
          skills={skills}
          currentAgentId={activeThread.agent_id}
          currentSkillId={activeThread.workflow_id}
          onSelect={async (agentId, skillId) => {
            await fetch(`/api/threads/${activeThread.id}/select-agent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ agent_id: agentId, workflow_id: skillId }),
            });
            setShowAgentPicker(false);
            // Refresh thread data
            const resp = await fetch(`/api/threads/${activeThread.id}`);
            if (resp.ok) {
              const updated = await resp.json();
              useAppStore.setState((state) => ({
                threads: state.threads.map((t) => (t.id === updated.id ? updated : t)),
              }));
            }
          }}
          onClose={() => setShowAgentPicker(false)}
        />
      )}

      {/* Focused Editor Overlay */}
      {isEditorOpen && (
        <div className="absolute inset-x-4 inset-y-4 z-40">
          <FocusedEditor />
        </div>
      )}

      {/* Intent bar */}
      <IntentBar />

      {/* Resize handle for right pane */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-bmad-primary/50 transition-colors z-10"
        onMouseDown={handleMouseDown}
      />
    </main>
  );
}
