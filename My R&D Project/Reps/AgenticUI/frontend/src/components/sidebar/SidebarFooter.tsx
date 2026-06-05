import { useWorkspaceStore } from "../../store/workspaceStore";
import { Plus, Settings, User } from "lucide-react";

export function SidebarFooter() {
  const { setActiveThread, activeProject, projects } = useWorkspaceStore();

  const handleNewThread = () => {
    const current = activeProject();
    const project = projects.find((p) => p.id === current?.id) ?? projects[0];
    if (project.threads.length > 0) {
      setActiveThread(project.threads[0].id);
    }
  };

  return (
    <div className="p-3 border-t border-stone-100 space-y-2">
      <button
        onClick={handleNewThread}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-text-primary text-white text-sm font-medium hover:bg-text-secondary transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Thread
      </button>

      <div className="flex items-center justify-between px-1">
        <button className="p-2 rounded-md hover:bg-stone-100 transition-colors text-text-tertiary">
          <Settings className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent-lavender-bg flex items-center justify-center">
            <User className="w-4 h-4 text-accent-lavender-text" />
          </div>
          <span className="text-xs text-text-secondary font-medium">Alex M.</span>
        </div>
      </div>
    </div>
  );
}
