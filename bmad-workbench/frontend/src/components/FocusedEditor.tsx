import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../store/useAppStore';
import { useAutoSave } from '../hooks/useAutoSave';
import DiffView from './DiffView';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

const TABS = ['Edit', 'Preview', 'Diff'] as const;
type Tab = (typeof TABS)[number];

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

function ToolbarButton({ icon, label, onClick, active }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'p-1.5 rounded-button text-[11px] font-medium transition-all',
        active
          ? 'bg-bmad-primary text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      )}
    >
      {icon}
    </button>
  );
}

export default function FocusedEditor() {
  const {
    focusedEditor,
    closeFocusedEditor,
    setEditedContent,
    setEditorTitle,
    activeThreadId,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<Tab>('Edit');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const editor = focusedEditor;
  const isOpen = editor?.isOpen ?? false;

  // Auto-save hook
  const { hasRecovery, recoveredContent, recoveredTitle, clearRecovery } = useAutoSave(
    activeThreadId,
    editor?.documentId ?? null,
    editor?.editedContent ?? '',
    editor?.title ?? ''
  );

  // Show recovery prompt when editor opens and recovery exists
  useEffect(() => {
    if (isOpen && hasRecovery) {
      setShowRecovery(true);
    }
  }, [isOpen, hasRecovery]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc closes editor
      if (e.key === 'Escape') {
        e.preventDefault();
        closeFocusedEditor();
        return;
      }
      // Cmd/Ctrl+Enter saves
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeFocusedEditor]);

  // Focus textarea when switching to Edit tab
  useEffect(() => {
    if (activeTab === 'Edit' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeTab]);

  if (!isOpen || !editor) {
    return <div data-testid="focused-editor-closed" className="hidden" />;
  }

  const handleRecovery = (useRecovery: boolean) => {
    if (useRecovery && recoveredContent !== null) {
      setEditedContent(recoveredContent);
      if (recoveredTitle !== null) {
        setEditorTitle(recoveredTitle);
      }
    }
    clearRecovery();
    setShowRecovery(false);
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = editor.editedContent;
    const selected = value.slice(start, end);

    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    setEditedContent(newValue);

    // Restore cursor position after state update
    setTimeout(() => {
      textarea.focus();
      const newCursor = start + before.length + selected.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const insertLine = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const value = editor.editedContent;
    const beforeCursor = value.slice(0, start);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;

    const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    setEditedContent(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursor = lineStart + prefix.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleSubmit = useCallback(async () => {
    if (!editor.documentId || saving) return;
    setSaving(true);
    setSaveError(null);

    try {
      const resp = await fetch(`${API_BASE}/api/documents/${editor.documentId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editor.editedContent,
          author_type: 'human',
          author_id: 'user-1', // TODO: use real user from auth context
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `Failed to save revision (${resp.status})`);
      }

      // Also update document title if changed
      if (editor.title) {
        await fetch(`${API_BASE}/api/documents/${editor.documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editor.title }),
        });
      }

      clearRecovery();
      closeFocusedEditor();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }, [editor, saving, clearRecovery, closeFocusedEditor]);

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col bg-white rounded-card shadow-bmad-lg overflow-hidden focused-editor-enter"
      style={{ willChange: 'transform' }}
      data-testid="focused-editor"
    >
      {/* Recovery prompt */}
      {showRecovery && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 shrink-0">
            <path d="M12 9v4" /><path d="M12 17h.01" /><circle cx="12" cy="12" r="10" />
          </svg>
          <span className="text-[12px] text-amber-800 flex-1">
            Recover unsaved edits from previous session?
          </span>
          <button
            onClick={() => handleRecovery(true)}
            className="text-[11px] bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-button font-medium transition-all"
          >
            Yes
          </button>
          <button
            onClick={() => handleRecovery(false)}
            className="text-[11px] text-amber-700 hover:text-amber-900 px-2 py-1 transition-colors"
          >
            No
          </button>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <input
          type="text"
          value={editor.title}
          onChange={(e) => setEditorTitle(e.target.value)}
          placeholder="Document title..."
          className="flex-1 text-heading font-semibold text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-300"
        />
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium shrink-0">
          Draft
        </span>
        <button
          onClick={closeFocusedEditor}
          className="text-caption text-slate-400 hover:text-slate-600 px-2 py-1 transition-colors shrink-0"
        >
          Return to stream
        </button>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
        <ToolbarButton
          label="Bold"
          icon={<strong>B</strong>}
          onClick={() => insertText('**', '**')}
        />
        <ToolbarButton
          label="Italic"
          icon={<em>I</em>}
          onClick={() => insertText('*', '*')}
        />
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolbarButton
          label="Heading"
          icon={<span className="font-serif">H</span>}
          onClick={() => insertLine('## ')}
        />
        <ToolbarButton
          label="Bullet list"
          icon={<span>•</span>}
          onClick={() => insertLine('- ')}
        />
        <ToolbarButton
          label="Numbered list"
          icon={<span>1.</span>}
          onClick={() => insertLine('1. ')}
        />
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolbarButton
          label="Link"
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          }
          onClick={() => insertText('[', '](url)')}
        />
        <ToolbarButton
          label="Table"
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" />
            </svg>
          }
          onClick={() => insertText('\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n')}
        />
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-slate-100">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-[11px] font-medium transition-colors',
              activeTab === tab
                ? 'text-bmad-primary border-b-2 border-bmad-primary'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        {activeTab === 'Edit' && (
          <textarea
            ref={textareaRef}
            value={editor.editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full p-4 font-mono text-[13px] leading-relaxed text-slate-800 bg-transparent resize-none outline-none"
            placeholder="Start writing your PRD..."
            spellCheck={false}
          />
        )}
        {activeTab === 'Preview' && (
          <div className="p-4 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {editor.editedContent}
            </ReactMarkdown>
          </div>
        )}
        {activeTab === 'Diff' && (
          <DiffView original={editor.originalContent} modified={editor.editedContent} />
        )}
      </div>

      {/* Error */}
      {saveError && (
        <div className="shrink-0 bg-red-50 border-t border-red-100 px-4 py-2 text-[11px] text-red-600">
          {saveError}
        </div>
      )}

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <span className="text-[11px] text-slate-400">
          {editor.editedContent.length} chars
          {editor.editedContent !== editor.originalContent && (
            <span className="text-amber-500 ml-2">• unsaved</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={closeFocusedEditor}
            className="text-caption text-slate-500 hover:text-slate-700 px-3 py-1.5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || editor.editedContent === editor.originalContent}
            className={cn(
              'text-caption px-4 py-1.5 rounded-button font-medium transition-all',
              saving || editor.editedContent === editor.originalContent
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-bmad-primary hover:bg-bmad-primary-light text-white shadow-bmad-sm'
            )}
          >
            {saving ? 'Saving...' : 'Save Revision'}
            <span className="ml-1 text-[10px] opacity-70">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+Enter
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
