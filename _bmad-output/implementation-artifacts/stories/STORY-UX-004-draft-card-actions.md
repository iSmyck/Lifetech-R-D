# STORY-UX-004: Draft Card Actions

## Status: ✅ Done

## Problem
Draft cards in the stream render Markdown but have no visible action buttons. The PRD specifies "Refine", "Challenge", and "Approve as [Name]" actions, but these are not implemented. Users cannot interact with the most critical artifact in the workflow.

## Solution
Implement a rich draft card with visible actions, inline editing, and approval workflow.

## Acceptance Criteria

### Draft Card Visual Design
- [ ] White background (`#ffffff`) with subtle shadow (`shadow-md`)
- [ ] 3px top border in indigo (to distinguish from AI reasoning cards)
- [ ] Version badge in top-right: "v1" (or v2, v3 for forks)
- [ ] Timestamp: "Generated at 14:32"
- [ ] AI attribution badge: "Drafted by AI · 2 checkpoints used"

### Action Bar
- [ ] Sticky action bar at bottom of draft card with 3 buttons:
  1. **"Refine"** (secondary) — opens Focused Editor
  2. **"Challenge"** (secondary) — opens inline comment mode
  3. **"Approve as [User Name]"** (primary, green) — triggers approval checkpoint
- [ ] Buttons have icons: ✏️ Refine, 💬 Challenge, ✓ Approve
- [ ] Action bar is always visible (sticky when scrolling long drafts)

### Focused Editor
- [ ] Clicking "Refine" expands draft card to fill stream pane (CSS transform)
- [ ] Surrounding cards blur and recede
- [ ] Editor toolbar: bold, italic, headings, lists, tables, code blocks
- [ ] Split view: Markdown source (left) / Rendered preview (right)
- [ ] "Save" and "Cancel" buttons
- [ ] Auto-save indicator: "Saved 10s ago"
- [ ] Press `Esc` or click "Return to stream" to collapse

### Inline Challenge Mode
- [ ] Clicking "Challenge" enables text selection highlighting
- [ ] User highlights text → tooltip appears: "Challenge this section"
- [ ] Click opens small modal: textarea for feedback + "Submit Challenge" button
- [ ] Challenge creates a fork (new version below)
- [ ] Show fork comparison toggle: "Show v1" / "Show v2"

### Approval Flow
- [ ] Clicking "Approve" shows confirmation modal:
  - Preview of document
  - Checkbox: "I have reviewed and approve this PRD"
  - "Approve as Sarah Chen" button (enabled after checkbox)
  - "Cancel" button
- [ ] After approval:
  - Card transforms to green-bordered approval checkpoint
  - "Approved by Sarah Chen at 14:45" with avatar
  - "Publish to KB" button appears

### Keyboard Shortcuts
- [ ] `E` on focused draft card → enter editor
- [ ] `Esc` → return to stream
- [ ] `Cmd/Ctrl+Enter` → submit from editor

## Technical Notes

**Files to modify:**
- `frontend/src/components/StreamCard.tsx` — add draft card actions
- `frontend/src/components/StreamCanvas.tsx` — handle editor expansion state

**New files:**
- `frontend/src/components/DraftCard.tsx` — rich draft card with action bar
- `frontend/src/components/FocusedEditor.tsx` — fullscreen editor component
- `frontend/src/components/ApprovalModal.tsx` — approval confirmation modal
- `frontend/src/components/ForkCompare.tsx` — version toggle between forks

**Backend:**
- `POST /api/documents/{id}/approve` already exists
- `POST /api/documents/{id}/revisions` already exists
- Need: `POST /api/documents/{id}/challenge` (or reuse revision with parent_reference)

## Effort: L (4-5 days)

## Dependencies: STORY-UX-001 (Visual Identity)
