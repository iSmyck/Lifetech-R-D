import { useWorkspaceStore } from "../../store/workspaceStore";
import { FileText, Image, FileSpreadsheet, FileCode, Folder } from "lucide-react";

const fileIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  csv: FileSpreadsheet,
  md: FileCode,
  png: Image,
  jpg: Image,
  default: FileText,
};

const mockFiles = [
  { name: "Brand Guidelines.pdf", type: "pdf", folder: "Assets" },
  { name: "Hero Images", type: "folder", folder: "Assets" },
  { name: "Q1_Cohort.csv", type: "csv", folder: "Data" },
  { name: "Campaign_Brief.md", type: "md", folder: "Docs" },
  { name: "Competitor_Screenshots", type: "folder", folder: "Research" },
];

export function ProjectFileList() {
  const folders = Array.from(new Set(mockFiles.map((f) => f.folder)));

  return (
    <div className="px-3 py-2 space-y-3">
      {folders.map((folder) => (
        <div key={folder}>
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-text-tertiary">
            <Folder className="w-3.5 h-3.5" />
            {folder}
          </div>
          <div className="space-y-0.5 mt-1">
            {mockFiles
              .filter((f) => f.folder === folder)
              .map((file) => {
                const Icon = file.type === "folder" ? Folder : (fileIcons[file.type] ?? fileIcons.default);
                return (
                  <button
                    key={file.name}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left hover:bg-stone-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                    <span className="text-sm text-text-secondary truncate">{file.name}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
