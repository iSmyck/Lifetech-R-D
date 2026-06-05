import { useState, useEffect, useCallback } from 'react';

interface TextSelectionState {
  text: string;
  rect: DOMRect | null;
  isActive: boolean;
}

export function useTextSelection(containerRef: React.RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<TextSelectionState>({
    text: '',
    rect: null,
    isActive: false,
  });

  const clearSelection = useCallback(() => {
    setSelection({ text: '', rect: null, isActive: false });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setSelection({ text: '', rect: null, isActive: false });
        return;
      }

      const range = sel.getRangeAt(0);
      // Check if selection is within our container
      if (!container.contains(range.commonAncestorContainer)) {
        setSelection({ text: '', rect: null, isActive: false });
        return;
      }

      const text = sel.toString().trim();
      if (!text) {
        setSelection({ text: '', rect: null, isActive: false });
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelection({ text, rect, isActive: true });
    };

    const handleMouseUp = () => {
      // Small delay to let selection settle
      setTimeout(handleSelectionChange, 10);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef]);

  return { selection, clearSelection };
}
