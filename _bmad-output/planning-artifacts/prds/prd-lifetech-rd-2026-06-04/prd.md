---
title: BMAD Stream Workbench — Phase 1 (PM/BA PRD Generation)
status: draft
created: 2026-06-04
updated: 2026-06-04
---

# PRD: BMAD Stream Workbench — Phase 1 (PM/BA PRD Generation)

## 0. Document Purpose

This PRD defines Phase 1 of the BMAD Stream Workbench — a browser-based AI workbench for Product Managers and Business Analysts to generate, refine, and approve Product Requirements Documents (PRDs) with human-in-the-loop oversight.

This document supersedes the initial BMAD Web UI PRD (dated 2026-06-04). The mental model has shifted from a pipeline/workflow orchestrator to a **reasoning stream** — a conversational workspace where AI reasoning is visible, human approval is sovereign, and documents are born inside the conversation thread.

Phase 1 is intentionally narrow: one user persona (PM/BA), one document type (PRD), one success metric (time-to-approval). Phase 2 will expand to Architects, UX Designers, and additional SDLC phases.

## 1. Vision

The BMAD Stream Workbench is an AI amplifier for PMs and BAs who refuse to be bypassed. It replaces manual Confluence-based PRD authoring with a transparent, steerable AI collaboration — where the analyst states intent, watches the AI reason aloud, intervenes at critical moments, and publishes under their own name.

Unlike chat interfaces that hide reasoning behind a typing indicator, the Stream Workbench surfaces every step: requirement analysis, stakeholder mapping, constraint checking, draft generation. The analyst sees not just the output, but the journey — and can grab the wheel whenever the reasoning diverges.

This matters because leadership has mandated AI modernization to reduce time-to-market, but the organization demands zero autonomous writes, full audit trails, and LDAP-scoped access. The Stream Workbench makes AI assistance feel like authorship, not surveillance.

## 2. Target User

### 2.1 Jobs To Be Done

- **JTBD-1:** As a PM/BA, I need to draft a PRD from a brief or meeting notes so that I can circulate it for stakeholder approval faster than writing it manually in Confluence.
- **JTBD-2:** As a PM/BA, I need to see why the AI made specific recommendations so that I can defend or correct them in stakeholder meetings.
- **JTBD-3:** As a PM/BA, I need to attach MoMs and reference Jira tickets inline so that the PRD is grounded in actual project context, not generic templates.
- **JTBD-4:** As a PM/BA, I need to publish the approved PRD to the knowledge base under my name so that ownership and accountability are clear.

### 2.2 Non-Users (Phase 1)

- System Architects — deferred to Phase 2 (canvas workspace).
- UX Designers — deferred to Phase 2 (design system integration).
- Developers who consume PRDs — they read the published output, not this UI.
- Compliance auditors — they review exported audit trails, not the live stream.

### 2.3 Key User Journeys

- **UJ-1. Sarah starts a PRD from a Jira ticket and meeting notes.**
  - **Persona + context:** Sarah, Senior BA, 6 hours/day in the tool. She needs to turn a Jira epic and last week's planning meeting into a draft PRD.
  - **Entry state:** Authenticated, on the Stream Workbench, thread list visible on left.
  - **Path:**
    1. Sarah clicks "New Thread" in the left pane.
    2. She types her intent in the bottom intent bar: "Draft PRD for Jira epic PROD-442 using the Q3 planning MoM and current Confluence baseline."
    3. She drags the MoM file into the stream; it lands as an attachment card.
    4. The AI begins reasoning — a reasoning ribbon appears with a breathing glow indicator.
    5. After 2 minutes, the AI pauses: "I found 3 stakeholder requirements in the MoM. Should I prioritize by MoSCoW or RICE?"
    6. Sarah answers; the stream continues.
    7. After 5 minutes, a draft PRD card appears in the stream. Sarah clicks "Refine" — the card expands into the focused editor.
    8. She edits two sections, clicks "Approve as Sarah Chen," and the stream records the approval checkpoint.
    9. She clicks "Publish to KB" and the PRD is exported as Markdown to the project Wiki.
  - **Climax:** Sarah published a stakeholder-ready PRD in 20 minutes instead of 4 hours.
  - **Resolution:** The thread is archived in the left pane. The audit trail shows every reasoning step, every intervention, and the final approval with Sarah's name.
  - **Edge case:** If the AI hits an LDAP boundary (e.g., can't access HR headcount data), the stream surfaces: "I can't access HR/headcount — your token doesn't include that group. Want to request access or proceed without it?"

- **UJ-2. Sarah challenges a draft section and regenerates it.**
  - **Persona + context:** Sarah reviewing the AI-generated PRD draft. She disagrees with the acceptance criteria wording.
  - **Entry state:** Draft PRD card is open in the focused editor within the stream.
  - **Path:**
    1. Sarah highlights the problematic acceptance criteria section.
    2. She clicks "Challenge" and types: "These criteria are too vague. Add specific throughput numbers from the performance baseline."
    3. The stream creates a fork: the original attempt collapses, a new attempt begins below with her feedback attached.
    4. The AI regenerates the section; Sarah toggles between v1 and v2 to compare.
    5. Satisfied, she approves v2.
  - **Climax:** Sarah's feedback is structural, attached, and preserved — not lost in a chat history.
  - **Resolution:** The approved version is the canonical one; the fork remains visible for audit.

- **UJ-3. Sarah resumes work after a customer meeting.**
  - **Persona + context:** Sarah stepped away for a 2-hour customer requirements session. She needs to pick up where she left off.
  - **Entry state:** Stream Workbench was left open or closed; session state is persisted.
  - **Path:**
    1. Sarah reopens the workbench; the left pane shows her active thread.
    2. She clicks it; the stream restores to the exact checkpoint where she left.
    3. The reasoning ribbon shows the AI was paused at "Awaiting clarification on priority framework."
    4. Sarah answers and continues.
  - **Climax:** No context lost. No "where was I?" friction.
  - **Resolution:** Session persistence is automatic; the analyst never rebuilds state.

## 3. Glossary

- **Thread** — A single PRD generation session. Contains the full stream of reasoning, checkpoints, drafts, forks, and approvals. Persistent and resumable.
- **Stream** — The central viewport showing the chronological record of a thread: user intents, AI reasoning steps, pause checkpoints, draft cards, approval checkpoints, and forks.
- **Reasoning Ribbon** — A collapsible UI element pinned above the active agent card during AI thinking phases. Shows operation descriptor, elapsed time, and optional expanded reasoning trace. Not a checkpoint — the user cannot intervene.
- **Checkpoint** — A human gate where the AI pauses and waits for explicit input. Two types in Phase 1: **Clarification Checkpoint** (AI asks a question) and **Validation Checkpoint** (AI presents a draft for approval).
- **Draft Card** — A rendered document preview that appears in the stream at the Validation Checkpoint. Clicking "Refine" expands it into the Focused Editor.
- **Focused Editor** — A fullscreen-within-the-pane editing surface for human review and modification of draft cards. Surrounding stream cards blur and recede; the draft becomes the temporary sole focus.
- **Fork** — A branch in the stream created when the user challenges a draft. The original attempt collapses; a new attempt begins below with the challenge feedback attached. Both versions remain visible for audit.
- **Attachment** — A passive storage object (MoM, reference doc, image) attached to a thread. Stored in MinIO; parsed and indexed on upload. The analyst references attachments naturally in intent text.
- **Continuous Execution** — An optional per-session mode (default: off) where the AI auto-resolves Clarification Checkpoints based on confidence thresholds. Requires typed activation and an amber persistent indicator. All reasoning is still logged for audit.
- **Approval Checkpoint** — The final gate before publication. Shows the analyst's name, timestamp, and "Publish to KB" action. The AI cannot proceed without explicit human approval.
- **Project Context** — The LDAP-scoped knowledge base (Confluence now, Wiki.js planned) and Jira projects accessible to the current user. The AI queries this context during reasoning but never writes to it autonomously.

## 4. Features

### 4.1 Stream Workbench Layout

**Description:** The primary workspace. A persistent three-pane layout with no page transitions. The stream is the hero; threads and context are supporting panes. Realizes all UJs.

**Functional Requirements:**

#### FR-1: Three-Pane Layout

The system shall render a persistent three-pane layout: Thread Navigator (left, 20%, 280px min), Stream (center, 55%, fluid), Context Panel (right, 25%, 320px min).

**Consequences (testable):**
- Layout proportions are user-resizable and persisted across sessions.
- No page transitions or full-screen modals within the workbench.
- The Stream pane is always visible; it transforms (not hides) when the Focused Editor is active.
- Dark mode (`#0d1117` or deeper) is the default theme; light mode is a Settings toggle.

#### FR-2: Thread Navigator

The left pane shall list all threads for the current user, grouped by project.

**Consequences (testable):**
- Each thread shows: title, last actor (user or agent), timestamp, status dot (active/completed/draft).
- Active threads expand to show checkpoint history (Clarification → Validation → Approved).
- A "Requirements Package" section houses published artifacts per project.
- Clicking a thread loads it in-place in the Stream pane — no page reload.
- New thread creation is one click + intent entry.

#### FR-3: Stream Canvas

The center pane shall display the chronological stream of a thread as vertically stacked cards with 16px gap.

**Consequences (testable):**
- User cards: `slate-800` background, 3px right border `emerald-500`, right-aligned.
- Agent cards: `slate-850` background, 3px left border `indigo-500`, left-aligned.
- During AI thinking: a reasoning ribbon is pinned above the active agent card with breathing glow indicator, operation descriptor, elapsed time, and expandable trace.
- During editing: the target draft card expands via CSS transform to fill the Stream pane; surrounding cards blur (`backdrop-filter: blur(4px)`) and push downward with 300ms ease.
- Stream auto-scrolls while AI is thinking; pauses if user scrolls up. A "Jump to live" floating button appears when scrolled back.
- All stream content is searchable with `Cmd+F` scoped to the current thread.

#### FR-4: Context Panel

The right pane shall display contextual information about the active thread via tabs.

**Consequences (testable):**
- **Document tab:** Live preview of the active draft (rendered Markdown, sans-serif, white card on dark).
- **Stakeholders tab:** Sortable list with RACI tags (Responsible, Accountable, Consulted, Informed).
- **Attachments tab:** Grid with drag-drop reorder; MoMs highlighted with document glyph (`📄`).
- **Resources tab:** Read-only cards for linked Jira tickets and Confluence pages (title, status, last-updated). Click opens source in new tab.

### 4.2 Intent & Reasoning

**Description:** The entry point and AI cognition visualization. The analyst states intent; the AI shows its work. Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Intent Bar

A persistent input field at the bottom of the Stream pane for natural language intent entry.

**Consequences (testable):**
- Placeholder: "What should I work on?"
- `Enter` submits; `Shift+Enter` for multiline.
- Auto-suggests recent intents and templates from history.
- Supports drag-drop of attachments directly into the input area.
- Attachment chips appear below the input before submission.

#### FR-6: Reasoning Ribbon

During AI thinking phases, a collapsible ribbon appears above the active agent card.

**Consequences (testable):**
- Breathing glow indicator (slow pulse, not a spinner).
- One-line operation descriptor: e.g., "Cross-referencing 3 stakeholder requirements against acceptance criteria..."
- Elapsed time since current operation began.
- Expandable chevron reveals a live, scrollable trace of high-level reasoning steps in muted monospace with semantic color tokens (indigo for actions, slate for data references).
- The analyst cannot intervene via the ribbon — it is read-only transparency.

#### FR-7: Clarification Checkpoint

When the AI needs input, the stream pauses and surfaces a distinct callout.

**Consequences (testable):**
- The reasoning ribbon expands automatically; the stream auto-scrolls to the checkpoint.
- Question appears in a blue-bordered (`#58a6ff`) callout card.
- Response options: structured buttons for common answers, or free-text input for open questions.
- The analyst's response becomes a user card in the stream; the AI resumes reasoning.
- If the analyst is away, the checkpoint persists indefinitely — no timeout.

### 4.3 Draft Generation & Editing

**Description:** The core value delivery — AI-generated drafts that the analyst reviews, edits, challenges, and approves. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-8: Draft Card

At the Validation Checkpoint, the AI presents a draft PRD as a rendered card in the stream.

**Consequences (testable):**
- Draft renders as a white card on dark canvas with full Markdown support (GFM, tables, Mermaid diagrams).
- Header shows: document title, version badge, timestamp.
- Actions: "Refine" (enter Focused Editor), "Challenge" (create fork with feedback), "Approve as [Name]."
- The analyst can expand/collapse the draft without entering edit mode.

#### FR-9: Focused Editor

Clicking "Refine" expands the draft card into a fullscreen-within-the-pane editing surface.

**Consequences (testable):**
- The draft card transforms to fill the Stream pane via CSS `transform: scale + translate`, 300ms, `cubic-bezier(0.25, 1, 0.5, 1)`.
- Surrounding stream cards blur and recede.
- Header mutates into document chrome: title field, status badge, "Return to stream" anchor (top-left).
- Editor supports: rich text formatting toolbar, inline comments, diff highlighting against AI-generated original.
- `Cmd/Ctrl+Enter` submits from editor; `Esc` returns to stream.
- Auto-save draft edits every 30s to `localStorage`; recoverable on re-entry.

#### FR-10: Inline Forking

Highlighting text and clicking "Challenge" creates a fork in the stream.

**Consequences (testable):**
- Original attempt collapses but remains visible with a "v1" label.
- New attempt begins below with the challenge feedback attached as a header note.
- Analyst can toggle between versions with a segmented control.
- Each fork preserves full audit context: timestamp, user, feedback text, AI reasoning trace.

#### FR-11: Approval Checkpoint

The final gate before publication. Human approval is mandatory.

**Consequences (testable):**
- Appears as a green-bordered (`#3fb950`) card with analyst's profile photo, name, timestamp.
- Button reads: "Approve as [Name]" — not "Approve AI Output."
- After approval, the stream records the checkpoint immutably.
- A second button appears: "Publish to KB" — exports the approved PRD as Markdown to the project's Wiki.
- The AI never exports autonomously; the human always triggers publication.

### 4.4 Attachments & Resources

**Description:** Passive storage for MoMs and reference materials, plus read-only linking to corporate resources. Realizes UJ-1.

**Functional Requirements:**

#### FR-12: Attachment Upload

Analysts can attach files to a thread via drag-drop or file picker.

**Consequences (testable):**
- Supported formats: DOCX, PDF, TXT, MD, PNG, JPG (MoMs primarily DOCX/PDF).
- Files upload to MinIO; a processing card shows "Indexing..." with progress bar.
- Once indexed, the attachment appears as a chip in the stream and the Attachments tab.
- Max file size: 100MB.
- Transcription for audio MoMs via faster-whisper (CPU-friendly, Dockerized).

#### FR-13: Passive Storage Model

Attachments are not automatically ingested into the AI's context unless explicitly referenced.

**Consequences (testable):**
- The analyst references attachments naturally in intent text: "Use the MoM from last Tuesday."
- The RAG layer resolves the reference because the attachment is in the thread context.
- Unreferenced attachments remain in storage but do not affect reasoning.

#### FR-14: Corporate Resource Linking

Jira tickets and Confluence pages appear as read-only linked cards.

**Consequences (testable):**
- Cards show: title, status, last-updated, one-line preview.
- Click opens source in new tab (never embedded iframe).
- The AI can fetch cached snapshots server-side for inline context; browser never talks directly to Jira.
- Resource cards carry permission badges: "Full access," "Read-only," "Access denied."

### 4.5 Continuous Execution Mode

**Description:** An optional per-session mode for power users who want reduced friction. Default is human-sovereign; this mode auto-resolves Clarification Checkpoints. Realizes Mary's "optional autonomy" requirement.

**Functional Requirements:**

#### FR-15: Activation Ritual

Continuous Execution requires deliberate, frictionful activation.

**Consequences (testable):**
- Accessed only via Command Palette (`Cmd/Ctrl+Shift+P` → "Toggle Continuous Execution").
- First activation per session triggers typed confirmation: user must type "ENABLE."
- Visual indicator: amber (`#d29922`) caution pill in stream header, never green.
- Resets to off on every session start — no persistence.
- Deactivation: one-click on the same pill (panic-off must be frictionless).

#### FR-16: Auto-Resolve Behavior

In Continuous Execution mode, the AI auto-resolves Clarification Checkpoints based on confidence thresholds.

**Consequences (testable):**
- The stream still surfaces the question and the AI's chosen answer as a collapsed card.
- The analyst can expand any auto-resolved checkpoint to inspect the reasoning.
- Validation Checkpoints are never auto-resolved — human approval is always required.
- All reasoning traces are persisted to the audit table even in Continuous Execution mode.

### 4.6 Backend & Infrastructure

**Description:** The technical foundation powering the Stream Workbench. Self-hosted, on-prem, zero external data egress.

**Functional Requirements:**

#### FR-17: Authentication & RBAC

LDAP-integrated authentication with project-scoped access control.

**Consequences (testable):**
- Users authenticate via LDAP; group membership maps to project roles.
- The frontend is authorization-naive — it renders what the API returns, nothing else.
- Project-scoped access: users see only threads and resources for projects they belong to.
- MoM permission inheritance: attachments share the project's access scope.

#### FR-18: SSE Event Streaming

Server-Sent Events provide real-time updates from backend to frontend.

**Consequences (testable):**
- `GET /api/sessions/{id}/stream` — SSE endpoint for thread events.
- Event types: `reasoning_token`, `checkpoint_pause`, `human_input`, `draft_complete`, `approval_recorded`.
- Client auto-reconnects with `Last-Event-ID` for recovery.
- SSE chosen over WebSockets for firewall-friendliness on-prem.

#### FR-19: Document & Revision Model

Immutable revision history with append-only audit trail.

**Consequences (testable):**
- `Document` table: identity, metadata, project reference.
- `Revision` table: immutable content snapshot, author (AI or human), timestamp, mode (human-sovereign or continuous-execution).
- `Approval` table: user ID, timestamp, revision reference, digital signature placeholder.
- All tables append-only; no deletions via UI or API.

#### FR-20: AI Gateway

vLLM serves models on-prem; LiteLLM proxy provides routing and rate limiting.

**Consequences (testable):**
- Model: Llama 3.1 8B Instruct or Mistral 7B Instruct, Q4_K_M quantization.
- GPU node: A100 or L40S with 24–48GB VRAM (minimum for pilot).
- LiteLLM proxy sits between FastAPI and vLLM for key management, request logging, and model swap without code changes.
- All prompts and responses logged centrally for audit.

#### FR-21: Async Job Pipeline

Celery + Redis handle background tasks.

**Consequences (testable):**
- Attachment parsing and indexing (text extraction, embedding generation).
- MoM transcription via faster-whisper.
- Embedding storage in pgvector (PostgreSQL extension).
- No background AI generation jobs — all AI reasoning is synchronous to the SSE stream.

#### FR-22: Export & Publication

Approved PRDs can be exported to the knowledge base.

**Consequences (testable):**
- Export format: Markdown (native for Wiki.js migration path).
- "Publish to KB" triggers a POST to the project's Wiki.js API or Confluence REST API (write-once, human-triggered).
- Export includes reasoning annotation footer: "Generated with AI assistance. Approved by [Name] at [Timestamp]."
- PDF/Word export deferred to Phase 2.

## 5. Non-Goals (Explicit)

- **Not a general-purpose document editor.** Scoped to PRDs and business analysis artifacts in Phase 1. No arbitrary file editing.
- **Not a real-time collaborative editor.** Single-editor model only. No multi-user cursors or operational transform.
- **Not an autonomous agent system.** The AI never commits, publishes, or acts without explicit human approval. Zero autonomous writes.
- **Not a canvas / diagramming tool.** Deferred to Phase 2 for Architect use cases. No whiteboard, no freeform spatial layout in Phase 1.
- **Not mobile-optimized.** Desktop-first (1280px+). Tablet best-effort; phone explicitly out.
- **Not a notification system.** No email/push/slack alerts. In-app status only.
- **Not a code generation environment.** No IDE integrations, no test runners, no API contract panels.

## 6. MVP Scope

### 6.1 In Scope

- Stream Workbench three-pane layout (Thread Navigator, Stream, Context Panel).
- Reasoning ribbon with breathing glow and expandable trace.
- Clarification and Validation checkpoints.
- Draft cards with Focused Editor (fullscreen-within-pane).
- Inline forking for challenged drafts.
- Approval checkpoint with "Approve as [Name]" and "Publish to KB."
- Intent bar with attachment drag-drop.
- MoM attachment upload, indexing, and passive storage.
- Jira/Confluence read-only resource linking.
- LDAP authentication with project-scoped RBAC.
- SSE real-time streaming.
- Self-hosted vLLM + LiteLLM proxy.
- PostgreSQL + pgvector for relational and vector data.
- MinIO for object storage.
- Celery + Redis for async jobs.
- Docker Compose deployment.

### 6.2 Out of Scope for Phase 1

- **Canvas / diagramming workspace** — deferred to Phase 2 (Architects).
- **Continuous Execution mode** — human-sovereign only for Phase 1. Auto-resolve mode is Phase 1b.
- **UX design system integration** — deferred to Phase 2 (UX Designers).
- **Code generation / IDE integrations** — deferred to Phase 2+ (Developers).
- **Multi-agent orchestration** — single AI agent per thread in Phase 1.
- **PDF/Word export** — Markdown-only export in Phase 1.
- **Real-time collaborative editing** — single editor only.
- **Mobile/tablet optimization** — desktop only.
- **Advanced search / full-text indexing across all threads** — basic thread list only.
- **Notification system** — in-app only.

## 7. Success Metrics

**Primary**
- **SM-1:** Requirements cycle time reduction — median hours from blank page to stakeholder-approved PRD. Target: **30% reduction vs. Confluence baseline**. Measurement: 2-week pre-pilot baseline, then 4-week pilot comparison.

**Secondary**
- **SM-2:** First-pass approval rate — % of PRDs approved without stakeholder revision rounds. Target: >50% (indicates reasoning quality improvement).
- **SM-3:** Stream persistence adoption — % of analysts who resume interrupted threads rather than starting new ones. Target: >80% (indicates session value).
- **SM-4:** Attachment utilization — % of threads that include at least one MoM or Jira reference. Target: >60% (indicates context-grounding behavior).

**Counter-metrics (do not optimize)**
- **SM-C1:** Time in Continuous Execution mode (if shipped in Phase 1b) — we do not want to maximize this. High usage may indicate checkpoint fatigue or trust issues with human-sovereign mode.
- **SM-C2:** Fork count per thread — high challenge rates may indicate poor initial draft quality, not engagement. Flag if median exceeds 2 forks per PRD.

## 8. Open Questions

1. **LDAP group mapping:** Which AD groups map to project membership? Is there an existing group-per-project convention?
2. **GPU procurement timeline:** Is the A100/L40S node budgeted and provisioned, or is it a procurement dependency?
3. **Confluence-to-Wiki.js migration:** Will Phase 1 write to Confluence REST API, or is the "Publish to KB" action deferred until Wiki.js is live?
4. **Stakeholder RACI source:** Does the AI infer RACI from project metadata, or does the analyst manually tag stakeholders per thread?
5. **Model selection:** Has the org evaluated Llama 3.1 8B vs. Mistral 7B for structured generation quality, or is this a pilot decision?

## 9. Assumptions Index

- **§4.1 FR-1:** React 18 + Vite is the chosen frontend stack. [ASSUMPTION: team has React expertise.]
- **§4.3 FR-9:** Monaco Editor can be wrapped for inline rich-text editing within the stream. [ASSUMPTION: Monaco or a similar component supports the required formatting toolbar and diff highlighting.]
- **§4.6 FR-20:** A GPU node with 24–48GB VRAM is available for vLLM serving. [ASSUMPTION: infrastructure budget approved.]
- **§4.6 FR-17:** LDAP directory has project-scoped groups that can be mapped to application roles. [ASSUMPTION: IT can provide group membership queries.]
- **§6.1:** A single AI agent (not multi-agent orchestration) is sufficient for PRD generation in Phase 1. [ASSUMPTION: one model + system prompt + RAG context can produce stakeholder-quality PRDs.]
- **§4.4 FR-12:** faster-whisper on CPU can transcribe 2-hour meeting audio in under 10 minutes. [ASSUMPTION: pilot MoMs are primarily text documents, not audio.]

---

## Cross-Cutting NFRs

### Performance
- Stream initial load < 2s (P95) for threads with < 100 cards.
- Reasoning ribbon updates every 1s during AI thinking.
- Draft card render < 1s for PRDs < 5,000 words.
- SSE reconnection < 3s after network interruption.

### Security
- All API endpoints require authenticated LDAP session (JWT).
- Zero external data egress — all LLM inference is on-prem.
- Approval actions are non-repudiable (logged with user ID, timestamp, digital signature placeholder).
- Attachments inherit project-level access scope; no cross-project leakage.
- Context bundles (templates, personas) are read-only for all users.

### Reliability
- Session state is persisted every 30s; full recovery on reconnect.
- SSE stream auto-reconnects with exponential backoff and `Last-Event-ID`.
- Attachment uploads resume on failure (chunked upload with retry).
- Database revisions are append-only; no data loss on rollback.

### Observability
- Structured logs for every API request (request ID, user, endpoint, latency, status).
- Audit stream for all approval actions, mode switches, and publication events.
- Admin dashboard (mocked in Phase 1) shows: workflow throughput, intervention rates, integration health, active sessions.
- Backend exposes `/health`, `/metrics`, and `/ready` endpoints for monitoring.

## Appendix A: Pilot Plan

**Scope:** 10 PMs/BAs, PRD-only, 6 weeks.

**Weeks 1–2:** Baseline measurement. Track current Confluence-based PRD cycle times (intake to stakeholder approval) for pilot participants.

**Weeks 3–6:** Pilot execution. Daily usage of Stream Workbench for PRD generation.

**Success criteria:** 30% median reduction in PRD cycle time + >50% first-pass approval rate.

**Go/No-go decision:** End of Week 6. If criteria met, leadership mandates broader rollout. If not, diagnose and iterate before Phase 2.
