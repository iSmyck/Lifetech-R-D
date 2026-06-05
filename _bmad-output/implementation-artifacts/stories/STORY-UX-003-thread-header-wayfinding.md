# STORY-UX-003: Thread Header & Wayfinding

## Status: ✅ Done

## Problem
The stream header shows `Thread: abc-123-def` (the raw ID) instead of the thread title. There are no breadcrumbs, no status context, no quick actions. Users lose orientation when switching between threads.

## Solution
Implement a rich thread header with breadcrumbs, status, metadata, and contextual actions.

## Acceptance Criteria

### Header Content
- [ ] Show thread title (not ID) prominently
- [ ] Show breadcrumb: `Project Name > Thread Title`
- [ ] Thread status badge with color:
  - Active: emerald dot + "Active"
  - Paused: amber dot + "Paused — Awaiting input"
  - Completed: blue dot + "Completed"
  - Aborted: red dot + "Aborted"
- [ ] Last updated timestamp: "Updated 2 min ago" (human-readable relative time)
- [ ] Creator avatar + name: "Created by Sarah Chen"

### Quick Actions
- [ ] Dropdown menu (⋮) with actions:
  - Rename thread
  - Duplicate thread
  - Archive thread
  - Export as Markdown
  - Share link (copy URL)
- [ ] "Invite reviewer" button (opens stakeholder picker)
- [ ] Pin/Unpin thread icon (for quick access in navigator)

### Breadcrumb Navigation
- [ ] Click project name in breadcrumb → filters thread navigator to that project
- [ ] Hover on breadcrumb shows project description tooltip

### Thread Metadata Bar
- [ ] Below header, a subtle metadata bar showing:
  - Document count: "1 draft"
  - Attachment count: "3 attachments"
  - Checkpoint count: "2 checkpoints answered"
  - Stakeholder count: "4 people involved"

### Responsive Behavior
- [ ] On narrow viewports (1280px), metadata bar collapses to icons with tooltips
- [ ] Breadcrumb truncates middle: `Project... > Thread...`

## Technical Notes

**Files to modify:**
- `frontend/src/components/StreamCanvas.tsx` — replace simple header with rich header
- `frontend/src/store/useAppStore.ts` — add `updateThread` action for rename

**New files:**
- `frontend/src/components/ThreadHeader.tsx` — rich header component
- `frontend/src/components/Breadcrumb.tsx` — breadcrumb navigation
- `frontend/src/hooks/useRelativeTime.ts` — human-readable time formatting

**Backend changes needed:**
- `PATCH /api/threads/{id}` already exists — verify it supports title updates

## Effort: S (1-2 days)

## Dependencies: STORY-UX-001 (Visual Identity)
