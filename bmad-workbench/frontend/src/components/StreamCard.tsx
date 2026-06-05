import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { StreamCard as StreamCardType } from '../types';
import { useAppStore } from '../store/useAppStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

interface Props {
  card: StreamCardType;
}

export default function StreamCard({ card }: Props) {
  const isUser = card.card_type === 'user_intent';
  const isCheckpoint = card.card_type === 'checkpoint_clarification';
  const isCheckpointResponse = card.card_type === 'checkpoint_response';
  const isDraft = card.card_type === 'draft';
  const isApproval = card.card_type === 'approval';
  const isReasoning = card.card_type === 'ai_reasoning';

  const contentText =
    typeof card.content.text === 'string'
      ? card.content.text
      : JSON.stringify(card.content);

  const phase = typeof card.content.phase === 'string' ? card.content.phase : undefined;
  const agentName = typeof card.content.agent_name === 'string' ? card.content.agent_name : undefined;
  const { activeAgent } = useAppStore();

  return (
    <div
      className={cn(
        'flex',
        isUser || isCheckpointResponse ? 'justify-end' : 'justify-start'
      )}
      data-testid="stream-card"
      data-card-type={card.card_type}
      data-phase={phase}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-card px-4 py-3 text-body relative',
          isUser && 'bg-bmad-surface-raised border-r-[3px] border-emerald-500 text-bmad-text',
          !isUser && !isCheckpoint && !isDraft && !isApproval && !isCheckpointResponse && 'bg-bmad-surface-raised border-l-[3px] border-bmad-primary text-bmad-text',
          isCheckpoint && 'bg-bmad-bg border border-status-info text-bmad-text w-full',
          isCheckpointResponse && 'bg-emerald-500/10 border-r-[3px] border-emerald-500 text-bmad-text',
          isDraft && 'bg-white text-slate-900 shadow-bmad-md border-t-[3px] border-bmad-primary',
          isApproval && 'bg-bmad-bg border border-emerald-500/30 text-bmad-text'
        )}
      >
        {/* Card type label with agent attribution */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-bmad-muted capitalize tracking-wide">
              {card.card_type.replace(/_/g, ' ')}
            </span>
            {/* Phase badge */}
            {phase && (
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                {phase}
              </span>
            )}
            {/* Agent attribution for reasoning/checkpoints */}
            {(isReasoning || isCheckpoint) && (agentName || activeAgent) && (
              <span className="text-[9px] text-bmad-muted">
                {activeAgent?.icon} {agentName || activeAgent?.name}
              </span>
            )}
          </div>
          {isDraft && (
            <span className="text-[10px] bg-bmad-primary/10 text-bmad-primary px-2 py-0.5 rounded-full font-medium">
              v1
            </span>
          )}
        </div>

        {isCheckpoint ? (
          <CheckpointCardContent card={card} />
        ) : isCheckpointResponse ? (
          <CheckpointResponseCardContent card={card} />
        ) : isDraft ? (
          <DraftCardContent card={card} contentText={contentText} />
        ) : (
          <p className="whitespace-pre-wrap">{contentText}</p>
        )}
      </div>
    </div>
  );
}

function CheckpointCardContent({ card }: { card: StreamCardType }) {
  const [responded, setResponded] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const checkpointId = String(card.content.checkpoint_id || '');
  const threadId = card.thread_id;
  const question = String(card.content.question || '');
  const options = Array.isArray(card.content.options) ? card.content.options : [];

  const handleResponse = async (response: string) => {
    if (!checkpointId || !threadId) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/threads/${threadId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpoint_id: checkpointId, response }),
      });
      setResponded(true);
    } catch (err) {
      console.warn('Failed to respond:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (responded) {
    return (
      <div className="flex items-center gap-2 text-caption text-bmad-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span>Response submitted. Awaiting AI to resume…</span>
      </div>
    );
  }

  return (
    <div>
      {question && (
        <div className="mb-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {question}
          </ReactMarkdown>
        </div>
      )}

      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {options.map((opt: string) => (
            <button
              key={opt}
              disabled={submitting}
              onClick={() => handleResponse(opt)}
              className={cn(
                'px-3 py-1.5 rounded-button text-caption font-medium transition-all',
                'bg-bmad-primary hover:bg-bmad-primary-light text-white shadow-bmad-sm',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (freeText.trim()) handleResponse(freeText.trim());
              }
            }}
            placeholder="Type your answer…"
            rows={2}
            maxLength={2000}
            className="flex-1 bg-bmad-surface-raised border border-bmad-border rounded-card px-3 py-2 text-caption text-bmad-text placeholder:text-bmad-muted resize-none focus:outline-none focus:ring-1 focus:ring-bmad-primary"
          />
          <button
            disabled={!freeText.trim() || submitting}
            onClick={() => handleResponse(freeText.trim())}
            className="bg-bmad-primary hover:bg-bmad-primary-light disabled:bg-bmad-surface-raised disabled:text-bmad-muted text-white px-3 py-2 rounded-button text-caption font-medium transition-all shadow-bmad-sm"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

function CheckpointResponseCardContent({ card }: { card: StreamCardType }) {
  const question = String(card.content.question || '');
  const response = String(card.content.response || '');
  const [timeLeft, setTimeLeft] = useState(30);
  const createdAt = new Date(card.created_at);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - createdAt.getTime()) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
        </svg>
        <span className="text-[10px] text-emerald-400 font-medium">Checkpoint response</span>
      </div>
      {question && (
        <div className="text-[11px] text-bmad-muted mb-1.5 italic border-l-2 border-bmad-border pl-2">
          {question}
        </div>
      )}
      <p className="text-body font-medium text-bmad-text">{response}</p>
      {timeLeft > 0 && (
        <button
          className="text-[10px] text-bmad-primary hover:text-bmad-primary-light mt-1.5 transition-colors"
          onClick={() => {/* TODO: implement grace period edit */}}
        >
          Edit ({timeLeft}s)
        </button>
      )}
    </div>
  );
}

function AgentAvatar() {
  const { activeAgent } = useAppStore();
  if (activeAgent) {
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-bmad-primary to-purple-500 flex items-center justify-center">
        <span className="text-white text-[10px]">{activeAgent.icon}</span>
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-bmad-primary to-purple-500 flex items-center justify-center">
      <span className="text-white text-[8px] font-bold">AI</span>
    </div>
  );
}

function DraftCardContent({ card, contentText }: { card: StreamCardType; contentText: string }) {
  const [showActions, setShowActions] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [approved, setApproved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveChecked, setApproveChecked] = useState(false);
  const { activeAgent, openFocusedEditor } = useAppStore();
  const agentLabel = activeAgent ? `${activeAgent.name} (${activeAgent.title})` : 'AI';

  const documentId = typeof card.content.document_id === 'string' ? card.content.document_id : undefined;
  const documentTitle = typeof card.content.title === 'string' ? card.content.title : 'Untitled Document';

  const handleApprove = useCallback(() => {
    setShowApproval(true);
  }, []);

  const handleApproveSubmit = useCallback(async () => {
    if (!documentId || !approveChecked) return;
    setApproving(true);
    try {
      const resp = await fetch(`${API_BASE}/api/documents/${documentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 'user-1' }),
      });
      if (resp.ok) {
        setApproved(true);
        setShowApproval(false);
      } else {
        console.warn('Approve failed:', resp.status);
      }
    } catch (err) {
      console.warn('Approve error:', err);
    } finally {
      setApproving(false);
    }
  }, [documentId, approveChecked]);

  const handleRefine = useCallback(() => {
    if (documentId) {
      openFocusedEditor(card, documentId, documentTitle);
    }
  }, [documentId, documentTitle, card, openFocusedEditor]);

  const isCollapsed = !isExpanded && contentText.length > 300;
  const displayText = isCollapsed ? contentText.slice(0, 300) : contentText;

  return (
    <div
      data-testid="draft-card-content"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={cn(
          'prose prose-sm max-w-none dark:prose-invert cursor-pointer relative',
          isCollapsed && 'max-h-[200px] overflow-hidden'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {displayText}
        </ReactMarkdown>
        {isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
      {isCollapsed && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-[11px] text-bmad-primary hover:text-bmad-primary-light mt-1 transition-colors"
        >
          Show more ({contentText.length - 300} chars)
        </button>
      )}

      {/* AI attribution */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        <AgentAvatar />
        <span className="text-[10px] text-slate-400">
          Drafted by {agentLabel} · {new Date(card.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Action bar */}
      {showActions && !approved && (
        <div className="flex items-center gap-2 mt-3 animate-fade-up">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-all border border-slate-200"
            onClick={handleRefine}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            Refine
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-all border border-slate-200"
            onClick={() => {/* TODO: Challenge mode */}}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            Challenge
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-medium transition-all shadow-bmad-sm ml-auto"
            onClick={handleApprove}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Approve
          </button>
        </div>
      )}

      {approved && (
        <div className="flex items-center gap-2 mt-3 p-2 rounded-card bg-emerald-50 border border-emerald-200">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span className="text-[11px] text-emerald-700 font-medium">Approved at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {/* Approval modal */}
      {showApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowApproval(false)}>
          <div className="bg-white rounded-modal p-6 max-w-md w-full mx-4 shadow-bmad-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-heading text-slate-900 font-semibold mb-2">Approve Document</h3>
            <p className="text-caption text-slate-500 mb-4">Review the draft before approving.</p>
            <div className="bg-slate-50 rounded-card p-3 max-h-40 overflow-y-auto mb-4 border border-slate-100">
              <p className="text-[11px] text-slate-600 whitespace-pre-wrap line-clamp-6">{contentText.slice(0, 500)}...</p>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="approve-check"
                checked={approveChecked}
                onChange={(e) => setApproveChecked(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="approve-check" className="text-caption text-slate-700">I have reviewed and approve this PRD</label>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-2 rounded-button text-caption font-medium transition-all"
                disabled={!approveChecked || approving}
                onClick={handleApproveSubmit}
              >
                {approving ? 'Approving...' : 'Approve'}
              </button>
              <button
                className="text-caption text-slate-500 hover:text-slate-700 px-4 py-2 transition-colors"
                onClick={() => setShowApproval(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
