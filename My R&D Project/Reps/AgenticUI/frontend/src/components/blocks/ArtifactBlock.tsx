import { ArtifactBlock as ArtifactBlockType } from "../../types";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { ARTIFACT_BADGES } from "../../lib/constants";
import { ArrowUpRight, Pencil, Download } from "lucide-react";

interface Props {
  block: ArtifactBlockType;
  delay: number;
}

export function ArtifactBlock({ block, delay }: Props) {
  const { openArtifact } = useWorkspaceStore();
  const badge = ARTIFACT_BADGES[block.artifact.type] ?? ARTIFACT_BADGES.email;
  const previewLines = block.artifact.content.split("\n").slice(0, 3).join(" ").slice(0, 120);

  return (
    <div
      className="block-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-surface rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] border border-stone-100/80 p-5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.04)] transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
              <span className="text-[11px] text-text-tertiary">v{block.artifact.version}</span>
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">{block.artifact.title}</h3>
            <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">{previewLines}...</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-50">
          <button
            onClick={() => openArtifact(block.artifact.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-text-primary text-white text-xs font-medium hover:bg-text-secondary transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Open
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 text-text-secondary text-xs font-medium transition-colors">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 text-text-secondary text-xs font-medium transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
