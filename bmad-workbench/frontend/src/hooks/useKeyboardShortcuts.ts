import { useEffect, useCallback } from 'react';

export type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        // Allow Escape and Cmd/Ctrl+K even in inputs
        if (e.key !== 'Escape' && !(e.metaKey || e.ctrlKey) && e.key !== 'k') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (e.metaKey || e.ctrlKey);
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.handler(e);
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function isMac() {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

export function formatShortcut(key: string, ctrl?: boolean): string {
  const mod = isMac() ? '⌘' : 'Ctrl';
  return ctrl ? `${mod}+${key}` : key;
}
