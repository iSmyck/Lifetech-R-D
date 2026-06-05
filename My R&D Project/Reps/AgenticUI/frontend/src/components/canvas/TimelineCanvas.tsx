import { useRef, useEffect } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { CanvasHeader } from "./CanvasHeader";
import { BlockRenderer } from "./BlockRenderer";

export function TimelineCanvas() {
  const activeThread = useWorkspaceStore((s) => s.activeThread());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.blocks.length]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <CanvasHeader />
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
          {activeThread?.blocks.map((block, i) => (
            <BlockRenderer key={block.id} block={block} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
