# STORY-UX-010: Progress & Notifications

## Status: ✅ Done

## Problem
Users have no visibility into what's happening in the background. When a checkpoint needs attention, they don't know unless they're actively watching the stream. There's no activity feed, no notifications, and no way to "continue where you left off."

## Solution
Implement a notification system with in-app alerts, an activity feed, and smart banners for paused/resumable work.

## Acceptance Criteria

### Notification Bell
- [ ] Bell icon in global header with unread badge count
- [ ] Click opens notification dropdown panel:
  - Unread notifications at top (bold)
  - Read notifications below (muted)
  - "Mark all as read" button
  - "Notification settings" link
- [ ] Notification types:
  - 🔵 **Checkpoint awaiting response**: "Thread 'Q2 PRD' needs your input"
  - 🟢 **Draft ready for review**: "Draft v1 is ready in 'Q2 PRD'"
  - 🟡 **Review requested**: "Alice Chen requested your review on 'API PRD'"
  - 🟣 **AI resumed**: "AI continued working on 'Q2 PRD'"
  - 🔴 **Error**: "Thread 'Q2 PRD' encountered an error"
- [ ] Click notification → navigates to relevant thread and scrolls to relevant card
- [ ] Auto-dismiss after 5 seconds for non-critical notifications

### Activity Feed
- [ ] "Activity" tab in Thread Navigator (optional fourth tab: Threads | Activity | Settings)
- [ ] Shows chronological feed of all activity across projects:
  - "You approved 'Q2 PRD' at 14:32"
  - "AI generated draft v2 in 'Q2 PRD' at 14:15"
  - "Alice Chen requested changes on 'API PRD' at 13:50"
  - "You uploaded 'planning-mom.docx' at 13:30"
- [ ] Filter by: My activity, Team activity, AI activity
- [ ] Click activity item → jump to thread

### Continue Where You Left Off
- [ ] Smart banner at top of Thread Navigator when user has:
  - Threads paused at checkpoints (awaiting response)
  - Drafts awaiting approval
  - Reviews pending from others
- [ ] Banner shows: "3 threads need your attention"
- [ ] Click expands to list of actionable threads with quick-action buttons:
  - "Respond" → jumps to checkpoint
  - "Review" → jumps to draft
  - "Approve" → jumps to approval

### Progress Indicators
- [ ] Replace "Generating…" text with progress steps:
  - "Analyzing requirements…" (step 1/4)
  - "Researching context…" (step 2/4)
  - "Drafting document…" (step 3/4)
  - "Finalizing…" (step 4/4)
- [ ] Subtle progress bar in reasoning ribbon
- [ ] Estimated time remaining (if predictable): "~2 min remaining"

### Browser Notifications
- [ ] Request permission on first visit
- [ ] Send browser notification for:
  - Checkpoint awaits response (if tab is not focused)
  - Draft ready for review (if tab is not focused)
  - Review requested by someone else
- [ ] Respect Do Not Disturb settings

### Toast Notifications
- [ ] Non-intrusive toast popups for:
  - "Thread created successfully"
  - "Attachment uploaded and processing"
  - "Draft approved and published"
  - "Checkpoint response saved"
- [ ] Position: bottom-right
- [ ] Auto-dismiss: 3 seconds
- [ ] Action buttons in toast: "View", "Undo"

## Technical Notes

**Files to modify:**
- `frontend/src/App.tsx` — add notification bell and toast container
- `frontend/src/components/StreamCanvas.tsx` — enhance reasoning ribbon with progress

**New files:**
- `frontend/src/components/NotificationBell.tsx` — notification dropdown
- `frontend/src/components/ActivityFeed.tsx` — activity timeline
- `frontend/src/components/AttentionBanner.tsx` — "continue where you left off"
- `frontend/src/components/ToastContainer.tsx` — toast system
- `frontend/src/components/ProgressRibbon.tsx` — enhanced reasoning with steps
- `frontend/src/hooks/useNotifications.ts` — notification state management

**Backend:**
- `GET /api/notifications` — list unread/read notifications
- `POST /api/notifications/{id}/read` — mark as read
- `POST /api/notifications/read-all` — mark all as read
- WebSocket or SSE push for real-time notifications

## Effort: L (4-5 days)

## Dependencies: STORY-UX-001 (Visual Identity), STORY-UX-003 (Thread Header)
