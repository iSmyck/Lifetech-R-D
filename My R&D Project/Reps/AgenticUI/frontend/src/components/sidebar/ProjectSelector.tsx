import { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { ChevronDown, Check } from "lucide-react";

export function ProjectSelector() {
  const { projects, activeProjectId, setActiveProject } = useWorkspaceStore();
  const [open, setOpen] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left"
      >
        <span className="font-semibold text-sm text-text-primary truncate">
          {activeProject?.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-tertiary flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-stone-100 py-1 z-20">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setActiveProject(project.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-stone-50 transition-colors"
              >
                <span className="flex-1 text-sm text-text-primary truncate">{project.name}</span>
                {project.id === activeProjectId && (
                  <Check className="w-4 h-4 text-accent-sky-text flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
