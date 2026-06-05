# STORY-009: Approval Checkpoint & Publish to KB

**Story ID:** STORY-009  
**Title:** Approval Checkpoint & Publish to KB  
**Effort:** M (3–4 days)  
**Dependencies:** STORY-007  

## Description
Implement the final Approval Checkpoint — a green-bordered card showing the analyst's name, timestamp, and "Approve as [Name]" button. After approval, a "Publish to KB" button exports the approved PRD as Markdown to the project's Wiki. This is the mandatory human gate before publication; the AI never exports autonomously.

## Acceptance Criteria

### AC-9.1: Approval card renders
- When draft is in ready state, an approval checkpoint card appears below it
- Green border (`#3fb950`), analyst profile avatar, name, timestamp
- Button text: "Approve as [Name]" (not "Approve AI Output")
- Button is primary action (filled, not outline)

### AC-9.2: Approval action
- Clicking "Approve as [Name]" triggers confirmation modal: "This will finalize the PRD. Continue?"
- On confirm: `POST /api/documents/{id}/approve` body: `{ "revision_id": "..." }`
- Backend creates `approvals` row with user ID, timestamp, signature placeholder
- Document status changes to `approved`
- Thread status changes to `completed`
- SSE emits `approval_recorded` event

### AC-9.3: Approval immutability
- Once approved, draft card shows "Approved" badge (green checkmark)
- No further edits allowed on approved revision
- "Refine" and "Challenge" buttons are hidden or disabled
- New intent on a completed thread creates a new thread (or prompts to fork)

### AC-9.4: Publish to KB
- After approval, "Publish to KB" button appears in approval card
- Clicking triggers `POST /api/documents/{id}/publish` body: `{ "target": "wiki_js", "project_id": "..." }`
- Backend exports Markdown with annotation footer: "Generated with AI assistance. Approved by [Name] at [Timestamp]."
- Returns `{ "published_url": "..." }`
- Publication recorded in `audit_log`

### AC-9.5: Publish targets
- Phase 1 supports Markdown export only
- Target `wiki_js`: POST to Wiki.js API (or mock if Wiki.js not ready)
- Target `confluence`: deferred to Phase 1b/2
- Export format: clean Markdown, no reasoning traces

### AC-9.6: Non-repudiation
- `approvals` table records: `revision_id`, `approved_by`, `approved_at`, `signature_placeholder`
- Audit log entry: `action: "draft_approved"`, details include revision ID and timestamp
- No soft deletes; approval records are append-only

## PRD References
- FR-11: Approval Checkpoint
- FR-22: Export & Publication
- UJ-1 (approval and publish)

## System Design References
- §4.3 Documents & Revisions API (`approve`, `publish` endpoints)
- §3.1 Core Entities (`approvals`, `documents`, `audit_log`)
- §7 Security & Compliance (approval non-repudiation)

## Implementation Notes
- `ApprovalCard` component with conditional "Publish to KB" button
- `useApproval` hook manages approval + publish mutations
- Backend `DocumentService` enforces state machine: draft → approved → published
- Wiki.js API integration mocked if endpoint unavailable; file written to disk as fallback
