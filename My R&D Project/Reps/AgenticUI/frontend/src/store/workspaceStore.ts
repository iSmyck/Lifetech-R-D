import { create } from "zustand";
import { Project, Thread, Block, SidebarMode, AgentStep, OutputType } from "../types";
import { projects } from "../lib/data";

interface WorkspaceState {
  projects: Project[];
  activeProjectId: string;
  activeThreadId: string;
  sidebarMode: SidebarMode;
  openArtifactId: string | null;
  isArtifactEditorMode: boolean;
  agentLogExpanded: Record<string, boolean>;
  isSidebarOpen: boolean;
  mode: "landing" | "workspace";

  // Getters
  activeProject: () => Project | null;
  activeThread: () => Thread | null;

  // Actions
  setMode: (mode: "landing" | "workspace") => void;
  setActiveProject: (id: string) => void;
  setActiveThread: (id: string) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  toggleSidebar: () => void;
  openArtifact: (id: string) => void;
  closeArtifact: () => void;
  toggleArtifactEditor: () => void;
  toggleAgentLog: (blockId: string) => void;
  acceptDiff: (blockId: string) => void;
  rejectDiff: (_blockId: string) => void;
  addBlock: (threadId: string, block: Block) => void;
  createThread: (title: string, preview: string) => Thread;
  updateAgentLogStep: (blockId: string, stepId: string, status: AgentStep["status"]) => void;
  completeAgentLog: (blockId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  projects,
  activeProjectId: projects[0].id,
  activeThreadId: projects[0].threads[0].id,
  sidebarMode: "threads",
  openArtifactId: null,
  isArtifactEditorMode: false,
  agentLogExpanded: {},
  isSidebarOpen: true,
  mode: "landing",

  activeProject: () => {
    const state = get();
    return state.projects.find((p) => p.id === state.activeProjectId) ?? null;
  },

  activeThread: () => {
    const state = get();
    for (const project of state.projects) {
      const thread = project.threads.find((t) => t.id === state.activeThreadId);
      if (thread) return thread;
    }
    return null;
  },

  setMode: (mode) => set({ mode }),

  setActiveProject: (id) => {
    const state = get();
    const project = state.projects.find((p) => p.id === id);
    set({
      activeProjectId: id,
      activeThreadId: project?.threads[0]?.id ?? state.activeThreadId,
    });
  },

  setActiveThread: (id) => set({ activeThreadId: id }),

  setSidebarMode: (mode) => set({ sidebarMode: mode }),

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

  openArtifact: (id) => set({ openArtifactId: id, isArtifactEditorMode: false }),

  closeArtifact: () => set({ openArtifactId: null, isArtifactEditorMode: false }),

  toggleArtifactEditor: () => set((s) => ({ isArtifactEditorMode: !s.isArtifactEditorMode })),

  toggleAgentLog: (blockId) =>
    set((s) => ({
      agentLogExpanded: { ...s.agentLogExpanded, [blockId]: !s.agentLogExpanded[blockId] },
    })),

  createThread: (title, preview) => {
    const state = get();
    const project = state.projects.find((p) => p.id === state.activeProjectId);
    if (!project) throw new Error("No active project");

    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      projectId: project.id,
      title,
      preview,
      updatedAt: new Date().toISOString(),
      blocks: [],
    };

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === project.id
          ? { ...p, threads: [newThread, ...p.threads] }
          : p
      ),
      activeThreadId: newThread.id,
    }));

    return newThread;
  },

  acceptDiff: (blockId) => {
    const state = get();
    const thread = state.activeThread();
    if (!thread) return;
    const diffBlock = thread.blocks.find((b) => b.id === blockId);
    if (!diffBlock || diffBlock.type !== "diff") return;

    const newProjects = state.projects.map((p) => ({
      ...p,
      threads: p.threads.map((t) =>
        t.id === thread.id
          ? {
              ...t,
              blocks: t.blocks.map((b) => {
                if (b.type === "artifact" && b.artifact.id === diffBlock.artifactId) {
                  return {
                    ...b,
                    artifact: { ...b.artifact, content: diffBlock.after, version: b.artifact.version + 1 },
                  };
                }
                return b;
              }),
            }
          : t
      ),
    }));

    set({ projects: newProjects });
  },

  rejectDiff: (_blockId) => {
    // Just remove the diff block visually by not showing it
    // In a real app we'd mark it rejected
  },

  addBlock: (threadId, block) => {
    set((s) => ({
      projects: s.projects.map((p) => ({
        ...p,
        threads: p.threads.map((t) =>
          t.id === threadId ? { ...t, blocks: [...t.blocks, block] } : t
        ),
      })),
    }));
  },

  updateAgentLogStep: (blockId, stepId, status) => {
    set((s) => ({
      projects: s.projects.map((p) => ({
        ...p,
        threads: p.threads.map((t) => ({
          ...t,
          blocks: t.blocks.map((b) => {
            if (b.id === blockId && b.type === "agent-log") {
              return {
                ...b,
                steps: b.steps.map((step) => (step.id === stepId ? { ...step, status } : step)),
              };
            }
            return b;
          }),
        })),
      })),
    }));
  },

  completeAgentLog: (blockId) => {
    set((s) => ({
      projects: s.projects.map((p) => ({
        ...p,
        threads: p.threads.map((t) => ({
          ...t,
          blocks: t.blocks.map((b) => {
            if (b.id === blockId && b.type === "agent-log") {
              return { ...b, status: "completed" as const };
            }
            return b;
          }),
        })),
      })),
    }));
  },
}));
