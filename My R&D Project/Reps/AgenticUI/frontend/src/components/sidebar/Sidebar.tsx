import { useWorkspaceStore } from "../../store/workspaceStore";
import { ProjectSelector } from "./ProjectSelector";
import { SidebarTabs } from "./SidebarTabs";
import { ThreadList } from "./ThreadList";
import { ProjectFileList } from "./ProjectFileList";
import { KnowledgeTab } from "./KnowledgeTab";
import { SidebarFooter } from "./SidebarFooter";
import { X } from "lucide-react";

export function Sidebar() {
  const { sidebarMode, isSidebarOpen, toggleSidebar } = useWorkspaceStore();

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-[270px] flex-shrink-0 flex flex-col bg-surface border-r border-stone-100 h-full relative">
      {/* Mobile close */}
      <button
        onClick={toggleSidebar}
        className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-stone-100 lg:hidden"
      >
        <X className="w-4 h-4 text-text-tertiary" />
      </button>

      <div className="p-4 pb-2">
        <ProjectSelector />
      </div>

      <SidebarTabs />

      <div className="flex-1 overflow-y-auto min-h-0">
        {sidebarMode === "threads" && <ThreadList />}
        {sidebarMode === "files" && <ProjectFileList />}
        {sidebarMode === "knowledge" && <KnowledgeTab />}
      </div>

      <SidebarFooter />
    </aside>
  );
}
