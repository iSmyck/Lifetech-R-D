import { create } from 'zustand';
import type { Thread, StreamCard, Project, BmadPhase, BmadAgent } from '../types';

export type Theme = 'light' | 'dark' | 'system';

export interface FocusedEditorState {
  cardId: string;
  documentId: string;
  originalContent: string;
  editedContent: string;
  title: string;
  isOpen: boolean;
}

interface AppState {
  projects: Project[];
  threads: Thread[];
  activeThreadId: string | null;
  streamCards: StreamCard[];
  isGenerating: boolean;
  reasoningText: string;
  layout: {
    leftWidth: number;
    rightWidth: number;
  };
  theme: Theme;
  // BMAD state
  bmadPhases: BmadPhase[];
  activeAgent: BmadAgent | null;
  // Focused editor state
  focusedEditor: FocusedEditorState | null;
  setProjects: (projects: Project[]) => void;
  setThreads: (threads: Thread[]) => void;
  addThread: (thread: Thread) => void;
  addProject: (project: Project) => void;
  setActiveThread: (id: string | null) => void;
  setStreamCards: (cards: StreamCard[]) => void;
  appendStreamCard: (card: StreamCard) => void;
  setGenerating: (val: boolean) => void;
  setReasoningText: (text: string) => void;
  setLayout: (layout: { leftWidth?: number; rightWidth?: number }) => void;
  setTheme: (theme: Theme) => void;
  setBmadPhases: (phases: BmadPhase[]) => void;
  setActiveAgent: (agent: BmadAgent | null) => void;
  openFocusedEditor: (card: StreamCard, documentId: string, title: string) => void;
  closeFocusedEditor: () => void;
  setEditedContent: (content: string) => void;
  setEditorTitle: (title: string) => void;
}

const STORAGE_KEY = 'bmad-theme';

function getInitialTheme(): Theme {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) return stored;
    }
  } catch {
    // ignore
  }
  return 'system';
}

export const useAppStore = create<AppState>((set) => ({
  projects: [],
  threads: [],
  activeThreadId: null,
  streamCards: [],
  isGenerating: false,
  reasoningText: '',
  layout: {
    leftWidth: 280,
    rightWidth: 320,
  },
  theme: getInitialTheme(),
  bmadPhases: [],
  activeAgent: null,
  focusedEditor: null,
  setProjects: (projects) => set({ projects }),
  setThreads: (threads) => set({ threads }),
  addThread: (thread) => set((state) => ({ threads: [thread, ...state.threads] })),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  setActiveThread: (id) => set({ activeThreadId: id, streamCards: [] }),
  setStreamCards: (cards) => set({ streamCards: cards }),
  appendStreamCard: (card) => set((state) => ({ streamCards: [...state.streamCards, card] })),
  setGenerating: (val) => set({ isGenerating: val }),
  setReasoningText: (text) => set({ reasoningText: text }),
  setLayout: (layout) => set((state) => ({ layout: { ...state.layout, ...layout } })),
  setTheme: (theme) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, theme);
      }
    } catch {
      // ignore
    }
    set({ theme });
  },
  setBmadPhases: (phases) => set({ bmadPhases: phases }),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  openFocusedEditor: (card, documentId, title) => set({
    focusedEditor: {
      cardId: card.id,
      documentId,
      originalContent: typeof card.content.text === 'string' ? card.content.text : JSON.stringify(card.content),
      editedContent: typeof card.content.text === 'string' ? card.content.text : JSON.stringify(card.content),
      title,
      isOpen: true,
    },
  }),
  closeFocusedEditor: () => set({ focusedEditor: null }),
  setEditedContent: (content) => set((state) => ({
    focusedEditor: state.focusedEditor ? { ...state.focusedEditor, editedContent: content } : null,
  })),
  setEditorTitle: (title) => set((state) => ({
    focusedEditor: state.focusedEditor ? { ...state.focusedEditor, title } : null,
  })),
}));
