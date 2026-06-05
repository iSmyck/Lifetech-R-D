import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "../../store/workspaceStore";
// getArtifactById removed - using store state directly
import { ARTIFACT_BADGES } from "../../lib/constants";
import { ArtifactViewer } from "./ArtifactViewer";
import { ArtifactEditor } from "./ArtifactEditor";
import { InlineArtifactChat } from "./InlineArtifactChat";
import { X, Pencil, Save, Download, Check } from "lucide-react";

export function ArtifactModal() {
  const { openArtifactId, closeArtifact, isArtifactEditorMode, toggleArtifactEditor } = useWorkspaceStore();
  const artifact = openArtifactId
    ? (() => {
        const state = useWorkspaceStore.getState();
        for (const project of state.projects) {
          for (const thread of project.threads) {
            for (const block of thread.blocks) {
              if (block.type === "artifact" && block.artifact.id === openArtifactId) {
                return block.artifact;
              }
            }
          }
        }
        return null;
      })()
    : null;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeArtifact();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeArtifact]);

  if (!artifact) return null;

  const badge = ARTIFACT_BADGES[artifact.type] ?? ARTIFACT_BADGES.email;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeArtifact} />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-[92vw] h-[90vh] max-w-6xl bg-surface rounded-2xl shadow-2xl border border-stone-100 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
              <h2 className="text-base font-semibold text-text-primary truncate">{artifact.title}</h2>
              <span className="text-[11px] text-text-tertiary">v{artifact.version}</span>
            </div>
            <button
              onClick={closeArtifact}
              className="p-2 rounded-lg hover:bg-stone-100 text-text-tertiary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex min-h-0">
            {/* Main viewer/editor */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              {isArtifactEditorMode ? (
                <ArtifactEditor artifact={artifact} />
              ) : (
                <ArtifactViewer artifact={artifact} />
              )}
            </div>

            {/* Side chat */}
            <div className="w-[320px] flex-shrink-0 border-l border-stone-100 hidden lg:flex flex-col">
              <InlineArtifactChat artifactId={artifact.id} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleArtifactEditor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 text-text-secondary text-xs font-medium transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                {isArtifactEditorMode ? "Preview" : "Edit"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 text-text-secondary text-xs font-medium transition-colors">
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-100 text-text-secondary text-xs font-medium transition-colors">
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-mint-bg text-accent-mint-text text-xs font-medium hover:opacity-80 transition-opacity">
                <Check className="w-3.5 h-3.5" />
                Mark as Final
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
