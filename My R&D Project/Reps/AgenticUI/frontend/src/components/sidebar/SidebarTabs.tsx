import { useWorkspaceStore } from "../../store/workspaceStore";
import { MessageCircle, FolderOpen, BookOpen } from "lucide-react";

const tabs = [
  { id: "threads" as const, icon: MessageCircle, label: "Threads" },
  { id: "files" as const, icon: FolderOpen, label: "Files" },
  { id: "knowledge" as const, icon: BookOpen, label: "Knowledge" },
];

export function SidebarTabs() {
  const { sidebarMode, setSidebarMode } = useWorkspaceStore();

  return (
    <div className="flex items-center gap-1 px-3 pb-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = sidebarMode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setSidebarMode(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? "bg-stone-100 text-text-primary"
                : "text-text-tertiary hover:text-text-secondary hover:bg-stone-50"
            }`}
            title={tab.label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
