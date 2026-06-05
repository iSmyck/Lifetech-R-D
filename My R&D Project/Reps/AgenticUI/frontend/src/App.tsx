import { useWorkspaceStore } from "./store/workspaceStore";
import { LandingPage } from "./components/landing/LandingPage";
import { Sidebar } from "./components/sidebar/Sidebar";
import { TimelineCanvas } from "./components/canvas/TimelineCanvas";
import { InputBar } from "./components/input/InputBar";
import { ArtifactModal } from "./components/artifact/ArtifactModal";
import { Menu } from "lucide-react";

function App() {
  const { mode, openArtifactId, isSidebarOpen, toggleSidebar } = useWorkspaceStore();

  if (mode === "landing") {
    return (
      <div className="h-full w-full bg-canvas">
        <LandingPage />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-canvas">
      {/* Mobile sidebar toggle */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-sm border border-stone-100 lg:hidden"
        >
          <Menu className="w-5 h-5 text-text-secondary" />
        </button>
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Canvas + Input */}
      <div className="flex flex-col flex-1 min-w-0">
        <TimelineCanvas />
        <InputBar />
      </div>

      {/* Artifact Modal */}
      {openArtifactId && <ArtifactModal />}
    </div>
  );
}

export default App;
