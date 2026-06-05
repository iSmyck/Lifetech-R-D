import { useMemo } from 'react';
import { diff_match_patch, DIFF_EQUAL, DIFF_INSERT, DIFF_DELETE } from 'diff-match-patch';

interface Props {
  original: string;
  modified: string;
}

const dmp = new diff_match_patch();

export default function DiffView({ original, modified }: Props) {
  const diffHtml = useMemo(() => {
    const diffs = dmp.diff_main(original, modified);
    dmp.diff_cleanupSemantic(diffs);

    const segments: { type: 'equal' | 'insert' | 'delete'; text: string }[] = [];

    for (const [op, text] of diffs) {
      if (op === DIFF_EQUAL) {
        segments.push({ type: 'equal', text });
      } else if (op === DIFF_INSERT) {
        segments.push({ type: 'insert', text });
      } else if (op === DIFF_DELETE) {
        segments.push({ type: 'delete', text });
      }
    }

    // Merge adjacent segments of same type for cleaner rendering
    const merged: typeof segments = [];
    for (const seg of segments) {
      const last = merged[merged.length - 1];
      if (last && last.type === seg.type) {
        last.text += seg.text;
      } else {
        merged.push({ ...seg });
      }
    }

    return merged;
  }, [original, modified]);

  if (original === modified) {
    return (
      <div className="p-4 text-center text-caption text-bmad-muted">
        No changes — content is identical to the original draft.
      </div>
    );
  }

  return (
    <div className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap p-4">
      {diffHtml.map((seg, i) => {
        if (seg.type === 'equal') {
          return <span key={i} className="text-slate-700 dark:text-slate-300">{seg.text}</span>;
        }
        if (seg.type === 'insert') {
          return (
            <ins
              key={i}
              className="bg-emerald-100 text-emerald-900 no-underline rounded px-0.5 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              {seg.text}
            </ins>
          );
        }
        if (seg.type === 'delete') {
          return (
            <del
              key={i}
              className="bg-red-100 text-red-900 rounded px-0.5 dark:bg-red-900/30 dark:text-red-300"
            >
              {seg.text}
            </del>
          );
        }
        return null;
      })}
    </div>
  );
}
