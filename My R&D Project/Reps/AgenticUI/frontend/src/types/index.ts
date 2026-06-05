export type BlockType = "user-prompt" | "agent-log" | "ai-response" | "artifact" | "diff" | "action";

export type OutputType = "email" | "social" | "landing" | "analysis" | "calendar" | "ad";

export type ArtifactType = "email" | "social" | "landing" | "analysis" | "calendar" | "ad";

export type SidebarMode = "threads" | "files" | "knowledge";

export interface Attachment {
  id: string;
  type: "brief" | "link" | "file" | "audience" | "brand";
  name: string;
  url?: string;
}

export interface AgentStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  timestamp?: string;
  detail?: string;
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  version: number;
  createdAt: string;
}

export interface Citation {
  id: string;
  number: number;
  title: string;
  excerpt: string;
  source: string;
}

interface BlockBase {
  id: string;
  threadId: string;
  createdAt: string;
  type: BlockType;
}

export interface UserPromptBlock extends BlockBase {
  type: "user-prompt";
  content: string;
  attachments: Attachment[];
  outputType: OutputType | null;
}

export interface AgentLogBlock extends BlockBase {
  type: "agent-log";
  steps: AgentStep[];
  status: "running" | "completed" | "error";
}

export interface AIResponseBlock extends BlockBase {
  type: "ai-response";
  content: string;
  citations?: Citation[];
}

export interface ArtifactBlock extends BlockBase {
  type: "artifact";
  artifact: Artifact;
}

export interface DiffBlock extends BlockBase {
  type: "diff";
  artifactId: string;
  before: string;
  after: string;
  description: string;
}

export interface ActionBlock extends BlockBase {
  type: "action";
  message: string;
  actionType: "export" | "save" | "publish";
}

export type Block = UserPromptBlock | AgentLogBlock | AIResponseBlock | ArtifactBlock | DiffBlock | ActionBlock;

export interface Thread {
  id: string;
  projectId: string;
  title: string;
  preview: string;
  updatedAt: string;
  blocks: Block[];
}

export interface Project {
  id: string;
  name: string;
  threads: Thread[];
}

export interface KnowledgeAsset {
  id: string;
  projectId: string;
  name: string;
  type: "pdf" | "csv" | "doc" | "url";
  status: "uploaded" | "processing" | "indexed" | "error";
  excerpt?: string;
}
