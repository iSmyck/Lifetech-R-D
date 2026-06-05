import { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { Share2, Download, Check } from "lucide-react";

export function CanvasHeader() {
  const activeThread = useWorkspaceStore((s) => s.activeThread());
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(activeThread?.title ?? "");
  const [showCopied, setShowCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  if (!activeThread) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-stone-100 bg-canvas/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
            autoFocus
            className="w-full text-sm font-semibold text-text-primary bg-transparent outline-none border-b border-sky-300"
          />
        ) : (
          <h2
            onDoubleClick={() => setIsEditing(true)}
            className="text-sm font-semibold text-text-primary truncate cursor-text"
            title="Double-click to edit"
          >
            {activeThread.title}
          </h2>
        )}
      </div>
      <div className="flex items-center gap-1 ml-4">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:bg-stone-100 transition-colors"
        >
          {showCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-accent-mint-text" />
              Copied
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              Share
            </>
          )}
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:bg-stone-100 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>
    </div>
  );
}
