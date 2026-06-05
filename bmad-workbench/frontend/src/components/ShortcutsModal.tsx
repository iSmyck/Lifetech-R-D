import { useEffect, useRef } from 'react';
import { isMac } from '../hooks/useKeyboardShortcuts';

interface Props {
  onClose: () => void;
}

const CATEGORIES = [
  {
    name: 'General',
    shortcuts: [
      { key: '?', description: 'Show keyboard shortcuts' },
      { key: '/', description: 'Search threads' },
      { key: 'k', ctrl: true, description: 'Command palette' },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      { key: 'j', description: 'Previous thread' },
      { key: 'k', description: 'Next thread' },
      { key: 'n', description: 'New thread' },
    ],
  },
  {
    name: 'Stream',
    shortcuts: [
      { key: 'e', description: 'Edit draft' },
      { key: 'r', description: 'Respond to checkpoint' },
      { key: 'a', description: 'Approve draft' },
    ],
  },
  {
    name: 'Input',
    shortcuts: [
      { key: 'Enter', description: 'Send message' },
      { key: 'Enter', shift: true, description: 'New line' },
      { key: 'ArrowUp', description: 'Recall last intent' },
    ],
  },
];

export default function ShortcutsModal({ onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatKey = (shortcut: { key: string; ctrl?: boolean; shift?: boolean }) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push(isMac() ? '⌘' : 'Ctrl');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key);
    return parts.join('+');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={modalRef}
        className="bg-bmad-surface rounded-modal p-6 max-w-lg w-full mx-4 border border-bmad-border shadow-bmad-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading text-bmad-text font-semibold">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-bmad-muted hover:text-bmad-text transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <h3 className="text-label text-bmad-muted uppercase mb-3">{cat.name}</h3>
              <div className="space-y-2">
                {cat.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-caption text-bmad-text">{s.description}</span>
                    <kbd className="text-[10px] font-mono bg-bmad-bg border border-bmad-border rounded px-1.5 py-0.5 text-bmad-muted">
                      {formatKey(s)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-bmad-border flex justify-end">
          <button
            onClick={onClose}
            className="text-caption bg-bmad-primary hover:bg-bmad-primary-light text-white px-4 py-2 rounded-button transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
