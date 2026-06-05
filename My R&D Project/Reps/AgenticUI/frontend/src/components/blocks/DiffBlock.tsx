import { DiffBlock as DiffBlockType } from "../../types";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { Check, X } from "lucide-react";

interface Props {
  block: DiffBlockType;
  delay: number;
}

export function DiffBlock({ block, delay }: Props) {
  const { acceptDiff } = useWorkspaceStore();

  // Simple line-by-line diff visualization
  const beforeLines = block.before.split("\n");
  const afterLines = block.after.split("\n");

  return (
    <div
      className="block-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-surface rounded-xl border border-stone-100/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-50 flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">{block.description}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => acceptDiff(block.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-mint-bg text-accent-mint-text text-xs font-medium hover:opacity-80 transition-opacity"
            >
              <Check className="w-3.5 h-3.5" />
              Apply
            </button>
            <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 text-text-tertiary text-xs font-medium transition-colors">
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-stone-50">
          <div className="p-3">
            <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Before</div>
            <div className="space-y-0.5">
              {beforeLines.slice(0, 8).map((line, i) => (
                <div key={i} className="text-xs text-text-secondary line-through decoration-red-300 bg-red-50/30 px-1.5 py-0.5 rounded">
                  {line || " "}
                </div>
              ))}
            </div>
          </div>
          <div className="p-3">
            <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">After</div>
            <div className="space-y-0.5">
              {afterLines.slice(0, 8).map((line, i) => (
                <div key={i} className="text-xs text-text-secondary bg-emerald-50/30 px-1.5 py-0.5 rounded">
                  {line || " "}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
