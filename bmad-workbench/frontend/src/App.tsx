import { useState, useEffect, useRef } from 'react';
import ThreadNavigator from './components/ThreadNavigator';
import StreamCanvas from './components/StreamCanvas';
import ContextPanel from './components/ContextPanel';
import ShortcutsModal from './components/ShortcutsModal';
import ToastContainer from './components/ToastContainer';
import Tooltip from './components/Tooltip';
import ThemeToggle from './components/ThemeToggle';
import ModelIndicator from './components/ModelIndicator';
import SettingsModal from './components/SettingsModal';
import { useAppStore } from './store/useAppStore';
import { useToasts } from './hooks/useToasts';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import { useLLMConfig } from './hooks/useLLMConfig';

function GlobalHeader({ onShowShortcuts, onShowSettings }: { onShowShortcuts: () => void; onShowSettings: () => void }) {
  const { activeThreadId, threads, projects } = useAppStore();
  useTheme();
  const { config } = useLLMConfig();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  // Close help menu when clicking outside
  useEffect(() => {
    if (!showHelpMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (helpMenuRef.current && !helpMenuRef.current.contains(e.target as Node)) {
        setShowHelpMenu(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHelpMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showHelpMenu]);

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const project = activeThread ? projects.find((p) => p.id === activeThread.project_id) : null;

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';
        const resp = await fetch(`${API_BASE}/api/notifications/unread-count`);
        if (resp.ok) {
          const data = await resp.json();
          setUnreadCount(data.count);
        }
      } catch {
        // silent
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 bg-bmad-surface border-b border-bmad-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* BMAD Logo / Wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-button bg-gradient-to-br from-bmad-primary to-purple-500 flex items-center justify-center shadow-bmad-sm">
            <span className="text-white text-caption font-bold">B</span>
          </div>
          <span className="text-heading text-bmad-text font-semibold tracking-tight hidden sm:block">
            BMAD
          </span>
        </div>

        {/* Brand accent line separator */}
        <div className="w-px h-6 bg-gradient-to-b from-transparent via-bmad-border to-transparent" />

        {/* Active thread breadcrumb */}
        {activeThread ? (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-bmad-muted truncate max-w-[120px]">{project?.name || 'Project'}</span>
            <span className="text-bmad-muted">/</span>
            <span className="text-bmad-text font-medium truncate max-w-[200px]">{activeThread.title}</span>
          </div>
        ) : (
          <span className="text-bmad-muted text-sm">Stream Workbench</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <Tooltip content="Search threads" shortcut="/">
          <button className="p-2 rounded-button text-bmad-muted hover:text-bmad-text hover:bg-bmad-surface-raised transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </Tooltip>

        {/* Notification bell */}
        <Tooltip content="Notifications">
          <button className="relative p-2 rounded-button text-bmad-muted hover:text-bmad-text hover:bg-bmad-surface-raised transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-status-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </Tooltip>

        {/* Help */}
        <div className="relative" ref={helpMenuRef}>
          <Tooltip content="Help" shortcut="?">
            <button
              className="p-2 rounded-button text-bmad-muted hover:text-bmad-text hover:bg-bmad-surface-raised transition-all"
              onClick={() => setShowHelpMenu(!showHelpMenu)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </button>
          </Tooltip>

          {showHelpMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-bmad-surface rounded-card border border-bmad-border shadow-bmad-lg z-50 py-1">
                <button
                  className="w-full text-left px-3 py-2 text-caption text-bmad-text hover:bg-bmad-surface-raised transition-colors flex items-center gap-2"
                  onClick={() => { onShowShortcuts(); setShowHelpMenu(false); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2" /><path d="M6 8h.01M6 12h.01" />
                  </svg>
                  Keyboard Shortcuts
                </button>
                <button className="w-full text-left px-3 py-2 text-caption text-bmad-text hover:bg-bmad-surface-raised transition-colors flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                  </svg>
                  Take a Tour
                </button>
                <div className="border-t border-bmad-border my-1" />
                <button className="w-full text-left px-3 py-2 text-caption text-bmad-muted hover:text-bmad-text hover:bg-bmad-surface-raised transition-colors">
                  Documentation
                </button>
                <button className="w-full text-left px-3 py-2 text-caption text-bmad-muted hover:text-bmad-text hover:bg-bmad-surface-raised transition-colors">
                  Report an Issue
                </button>
              </div>
          )}
        </div>

        {/* Model indicator */}
        <ModelIndicator config={config} onClick={() => { setShowHelpMenu(false); onShowSettings(); }} />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar */}
        <button onClick={() => { setShowHelpMenu(false); onShowSettings(); }} className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[11px] font-bold text-white ml-1 hover:ring-2 hover:ring-bmad-primary/50 transition-all">
          U
        </button>
      </div>
    </header>
  );
}

function App() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();

  useKeyboardShortcuts([
    { key: '?', handler: () => setShowShortcuts(true) },
    { key: 'k', ctrl: true, handler: () => addToast({ message: 'Command palette coming soon', type: 'info' }) },
  ]);

  return (
    <div className="flex flex-col h-full w-full bg-bmad-bg text-bmad-text">
      <GlobalHeader onShowShortcuts={() => setShowShortcuts(true)} onShowSettings={() => setShowSettings(true)} />
      <div className="brand-accent-line shrink-0" />
      <div className="flex-1 flex min-h-0">
        <ThreadNavigator />
        <StreamCanvas />
        <ContextPanel />
      </div>

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
