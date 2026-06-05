export type ThreadStatus = 'active' | 'paused' | 'completed' | 'aborted';
export type CardType = 'user_intent' | 'ai_reasoning' | 'checkpoint_clarification' | 'checkpoint_validation' | 'draft' | 'approval' | 'fork' | 'attachment' | 'checkpoint_response';
export type DocumentStatus = 'draft' | 'approved' | 'published';

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Thread {
  id: string;
  project_id: string;
  title: string;
  status: ThreadStatus;
  is_pinned: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  agent_id?: string | null;
  workflow_id?: string | null;
  bmad_state?: ThreadBmadState | null;
}

export interface StreamCard {
  id: string;
  thread_id: string;
  card_type: CardType;
  sequence_number: number;
  content: Record<string, unknown>;
  created_at: string;
}

export interface User {
  id: string;
  display_name: string;
  email: string;
}

export interface Document {
  id: string;
  thread_id: string;
  project_id: string;
  title: string;
  status: DocumentStatus;
  current_revision_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends Document {
  current_revision: {
    id: string;
    document_id: string;
    content: string;
    author_type: string;
    author_id: string;
    created_at: string;
  } | null;
}

export type AttachmentStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface Attachment {
  id: string;
  thread_id: string;
  project_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  status: AttachmentStatus;
  parsed_text?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  thread_id: string;
  type: 'jira' | 'confluence';
  external_id: string;
  title: string;
  status: string | null;
  url: string | null;
  metadata_json: string | null;
  include_in_ai_context: string;
  created_at: string;
}

export interface ResourceSearchResult {
  external_id: string;
  title: string;
  status?: string | null;
  assignee?: string | null;
  last_updated?: string | null;
  url?: string | null;
  space_name?: string | null;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: 'responsible' | 'accountable' | 'consulted' | 'informed';
  email: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  thread_id?: string;
  type: 'checkpoint' | 'draft' | 'review' | 'error' | 'ai_resumed';
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export type IntentTemplate = {
  id: string;
  label: string;
  icon: string;
  template: string;
};

// --- BMAD types ---

export interface BmadAgent {
  id: string;
  name: string;
  title: string;
  icon: string;
  description: string;
  module: string;
  team: string;
}

export interface BmadSkill {
  skill_id: string;
  name: string;
  description: string;
  phases: string[];
  intent_triggers: string[];
  module?: string;
}

export interface BmadPhase {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
}

export interface ThreadBmadState {
  skill_id?: string;
  current_phase?: string;
  phases_completed?: string[];
  checkpoint_state?: Record<string, unknown>;
  artifact_accumulator?: string;
  classification?: Record<string, unknown>;
  agent_switch?: Record<string, unknown>;
}
