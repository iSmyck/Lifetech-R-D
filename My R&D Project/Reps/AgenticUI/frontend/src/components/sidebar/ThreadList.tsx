import { useWorkspaceStore } from "../../store/workspaceStore";
import { Thread } from "../../types";
import { formatDistanceToNow } from "../../lib/date";

function groupThreads(threads: Thread[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; threads: Thread[] }[] = [
    { label: "Today", threads: [] },
    { label: "Yesterday", threads: [] },
    { label: "Previous 7 Days", threads: [] },
    { label: "Older", threads: [] },
  ];

  for (const thread of threads) {
    const d = new Date(thread.updatedAt);
    if (d >= today) groups[0].threads.push(thread);
    else if (d >= yesterday) groups[1].threads.push(thread);
    else if (d >= weekAgo) groups[2].threads.push(thread);
    else groups[3].threads.push(thread);
  }

  return groups.filter((g) => g.threads.length > 0);
}

export function ThreadList() {
  const { activeProject, activeThreadId, setActiveThread } = useWorkspaceStore();
  const project = activeProject();

  if (!project) return null;

  const groups = groupThreads(project.threads);

  return (
    <div className="px-2 py-2 space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="px-2 py-1 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
            {group.label}
          </div>
          <div className="space-y-0.5">
            {group.threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThread(thread.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-stone-50 border-l-2 border-sky-500"
                      : "hover:bg-stone-50 border-l-2 border-transparent"
                  }`}
                >
                  <div className="text-sm font-medium text-text-primary truncate leading-tight">
                    {thread.title}
                  </div>
                  <div className="text-xs text-text-tertiary truncate mt-0.5 leading-tight">
                    {thread.preview}
                  </div>
                  <div className="text-[11px] text-text-tertiary mt-1">
                    {formatDistanceToNow(new Date(thread.updatedAt))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
