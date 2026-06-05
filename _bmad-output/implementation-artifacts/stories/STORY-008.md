# STORY-008: Inline Forking

**Story ID:** STORY-008  
**Title:** Inline Forking  
**Effort:** M (3–4 days)  
**Dependencies:** STORY-007  

## Description
Implement inline forking: when the analyst highlights text in a draft and clicks "Challenge," the stream creates a branch. The original attempt collapses with a "v1" label, a new attempt begins below with the challenge feedback attached. Both versions remain visible for audit; the analyst can toggle between versions.

## Acceptance Criteria

### AC-8.1: Text selection + Challenge action
- In Focused Editor or expanded Draft Card, user can select/highlight text
- A floating "Challenge" button appears near selection
- Clicking "Challenge" opens a modal/popover with textarea for feedback
- Feedback textarea has placeholder: "What should change about this section?"

### AC-8.2: Fork creation in stream
- On challenge submission, original draft card collapses to compact "v1" label
- New `fork` card appears below with challenge feedback as header note
- AI resumes reasoning on the fork; reasoning ribbon shows "Regenerating section..."
- New attempt labeled "v2" (or next version number)

### AC-8.3: Version toggle
- Segmented control appears when multiple versions of a section exist
- Options: "v1", "v2", etc.
- Clicking a version expands that draft and collapses others
- Current approved version is marked with green checkmark

### AC-8.4: Fork audit preservation
- Each fork preserves: timestamp, user ID, feedback text, AI reasoning trace
- Fork lineage stored in `revisions.parent_revision_id`
- `GET /api/documents/{id}` returns full revision tree with `parent_revision_id` chain

### AC-8.5: Fork API
- `POST /api/threads/{id}/fork` body: `{ "revision_id": "...", "feedback": "...", "highlighted_text": "..." }`
- Backend creates new thread state branching from checkpoint
- Returns `{ "fork_thread_id": "...", "status": "generating" }`
- SSE events continue on the new fork thread

### AC-8.6: Visual distinction
- Fork cards have amber (`#d29922`) left border instead of indigo
- Collapsed v1 label shows "Original attempt" on hover
- Challenge feedback card is visually distinct: dotted border, italic text

## PRD References
- FR-10: Inline Forking
- UJ-2 (challenge and regenerate)

## System Design References
- §3.1 Core Entities (`revisions.parent_revision_id`)
- §4.3 Documents & Revisions API

## Implementation Notes
- `useTextSelection` hook detects selection in Draft Card / Editor
- `ForkCard` component handles version toggle UI
- Backend revision tree query uses recursive CTE or application-level tree build
- For Phase 1, limit to one active fork per section (no nested forks)
