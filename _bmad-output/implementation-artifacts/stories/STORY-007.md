# STORY-007: Draft Card & Focused Editor

**Story ID:** STORY-007  
**Title:** Draft Card & Focused Editor  
**Effort:** L (4–6 days)  
**Dependencies:** STORY-004, STORY-006  

## Description
Implement the Draft Card that appears at the Validation Checkpoint, and the Focused Editor — a fullscreen-within-the-pane editing surface for human review and modification. The draft card supports Markdown rendering, expand/collapse, and transforms into the Focused Editor via CSS `transform` animation.

## Acceptance Criteria

### AC-7.1: Draft card rendering
- `draft_complete` SSE event triggers draft card insertion into stream
- Draft renders as white card (`bg-white text-slate-900`) on dark canvas
- Full Markdown support: GFM, tables, Mermaid diagrams (if library available)
- Header shows: document title, version badge (e.g., "v1.2"), timestamp
- Actions: "Refine", "Challenge", "Approve as [Name]"

### AC-7.2: Draft expand/collapse
- Clicking draft body toggles expand/collapse
- Collapsed: shows first 300 characters + "..." with fade overlay
- Expanded: shows full content with scrollable container
- State is local to component; does not persist

### AC-7.3: Focused Editor activation
- Clicking "Refine" transforms draft card to fill the Stream pane
- CSS `transform: scale + translate`, 300ms, `cubic-bezier(0.25, 1, 0.5, 1)`
- Surrounding stream cards: `backdrop-filter: blur(4px)`, `opacity: 0.3`, pushed downward
- Header mutates to document chrome: title field (editable), status badge, "Return to stream" anchor

### AC-7.4: Editor functionality
- Rich text formatting toolbar: bold, italic, heading, list, link, table
- Inline diff highlighting against AI-generated original (additions: green, deletions: red strikethrough)
- `Cmd/Ctrl+Enter` submits edits; `Esc` returns to stream without saving
- Content is Markdown source edited via textarea or lightweight editor (Monaco or ProseMirror optional)

### AC-7.5: Auto-save
- Every 30s, draft edits saved to `localStorage` under key `bmad:draft:{thread_id}`
- On re-entering Focused Editor, recover from `localStorage` if newer than server revision
- User prompted: "Recover unsaved edits?" with Yes/No
- Saved drafts cleared from `localStorage` on successful submit

### AC-7.6: Revision creation
- `POST /api/documents/{id}/revisions` body: `{ "content": "...", "author_type": "human" }`
- Backend creates new revision, updates document `current_revision_id`
- Response: `{ "revision_id": "..." }`
- New revision appears as updated draft card in stream

### AC-7.7: Keyboard navigation
- `Esc` from Focused Editor returns to stream
- `Tab` cycles through toolbar buttons, title field, editor, submit button
- Focus trap within editor when active

## PRD References
- FR-8: Draft Card
- FR-9: Focused Editor
- UJ-1 (draft review), UJ-2 (challenge and regenerate)

## System Design References
- §4.3 Documents & Revisions API
- §3.1 Core Entities (`documents`, `revisions`)

## Implementation Notes
- `DraftCard` component with collapsed/expanded states
- `FocusedEditor` component mounted conditionally, uses React Portal or absolute positioning
- CSS transform for animation; use `will-change: transform` for performance
- Diff highlighting via `diff-match-patch` or `jsdiff` libraries
- For Phase 1, use a styled textarea with Markdown preview toggle instead of full Monaco
