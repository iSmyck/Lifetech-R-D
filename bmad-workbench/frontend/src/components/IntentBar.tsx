import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { StreamCard } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

const TEMPLATES = [
  { id: 'prd', label: '📝 PRD', template: 'Draft a PRD for [project] that covers...' },
  { id: 'brd', label: '📋 BRD', template: 'Create a business requirements document for...' },
  { id: 'stories', label: '👤 User Stories', template: 'Generate user stories for...' },
  { id: 'mom', label: '📊 MoM Summary', template: 'Summarize the meeting notes about...' },
  { id: 'update', label: '🔄 Update Doc', template: 'Update the existing PRD for...' },
];

export default function IntentBar() {
  const [text, setText] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { activeThreadId, streamCards, appendStreamCard } = useAppStore();

  const hasCards = streamCards.length > 0;
  const hasCheckpoint = streamCards.some((c) => c.card_type === 'checkpoint_clarification');

  const placeholder = !activeThreadId
    ? 'Select a thread to start typing...'
    : hasCheckpoint
    ? 'Respond to the checkpoint...'
    : hasCards
    ? 'Ask a follow-up question...'
    : 'What should I work on?';

  const handleSubmit = async () => {
    if (!text.trim() || !activeThreadId) return;

    const userCard: StreamCard = {
      id: `card-${Date.now()}`,
      thread_id: activeThreadId,
      card_type: 'user_intent',
      sequence_number: Date.now(),
      content: { text: text.trim(), attachment_ids: selectedAttachments },
      created_at: new Date().toISOString(),
    };

    appendStreamCard(userCard);
    setText('');
    setSelectedAttachments([]);

    try {
      await fetch(`${API_BASE}/api/threads/${activeThreadId}/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          attachment_ids: selectedAttachments.length > 0 ? selectedAttachments : undefined,
        }),
      });
    } catch (err) {
      console.warn('Failed to send intent:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTemplateClick = useCallback((template: string) => {
    setText(template);
    setShowTemplates(false);
    textareaRef.current?.focus();
  }, []);

  // Auto-expand textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  // Keyboard shortcut: / focuses intent bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const charCount = text.length;
  const charWarning = charCount > 1800 ? 'text-status-error' : charCount > 1500 ? 'text-status-warning' : 'text-bmad-muted';

  return (
    <div className="border-t border-bmad-border bg-bmad-surface p-3 shrink-0" data-testid="intent-bar">
      {/* Template chips */}
      {showTemplates && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-thin animate-fade-up">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTemplateClick(t.template)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bmad-surface-raised border border-bmad-border hover:border-bmad-primary/30 hover:shadow-bmad-sm text-caption text-bmad-text transition-all"
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setShowTemplates(false)}
            className="shrink-0 text-[10px] text-bmad-muted hover:text-bmad-text px-2 transition-colors"
          >
            Hide
          </button>
        </div>
      )}

      {!showTemplates && (
        <button
          onClick={() => setShowTemplates(true)}
          className="text-[10px] text-bmad-muted hover:text-bmad-text mb-2 transition-colors"
        >
          + Show templates
        </button>
      )}

      {/* Attachment chips */}
      {selectedAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedAttachments.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 text-[10px] bg-bmad-primary/15 text-bmad-primary-light px-2 py-0.5 rounded-full border border-bmad-primary/20"
            >
              📎 {id.slice(0, 8)}…
              <button
                onClick={() => setSelectedAttachments((prev) => prev.filter((a) => a !== id))}
                className="hover:text-white transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-bmad-bg border border-bmad-border rounded-card px-3 py-2.5 text-body text-bmad-text placeholder:text-bmad-muted/50 resize-none focus:outline-none focus:ring-1 focus:ring-bmad-primary/50 min-h-[44px] max-h-[120px] scrollbar-thin disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            disabled={!activeThreadId}
          />
          {/* Character count */}
          <span className={cn('absolute right-2 bottom-1 text-[10px]', charWarning)}>
            {charCount}/2000
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || !activeThreadId}
          className="bg-bmad-primary hover:bg-bmad-primary-light disabled:bg-bmad-surface-raised disabled:text-bmad-muted text-white px-4 py-2.5 rounded-button text-body font-medium transition-all shadow-bmad-sm hover:shadow-bmad-md shrink-0"
          title="Send (Enter)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
