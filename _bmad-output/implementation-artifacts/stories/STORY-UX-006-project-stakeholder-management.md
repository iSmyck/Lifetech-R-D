# STORY-UX-006: Project & Stakeholder Management

## Status: ✅ Done

## Problem
The Stakeholders tab shows 4 hardcoded mock people. There's no way to add real stakeholders, assign RACI roles, or manage project membership. In a 200-person hierarchical org, this is a compliance and accountability gap.

## Solution
Implement real stakeholder management with RACI assignment, project member management, and review request workflows.

## Acceptance Criteria

### Project Settings
- [ ] Add "Project Settings" option in Thread Navigator (gear icon next to project name)
- [ ] Settings modal with tabs: Members, Stakeholders, Integrations, Danger Zone

### Member Management
- [ ] Members tab shows current project members with:
  - Avatar + name + email
  - Role badge (analyst, lead, viewer)
  - Joined date
  - Remove button (lead only)
- [ ] "Add Member" button with search:
  - Search input with autocomplete from backend user directory
  - Results show avatar, name, email, current projects
  - Select + assign role → Add
- [ ] Member count badge on project header

### RACI Stakeholder Management
- [ ] Stakeholders tab in Context Panel shows REAL data (not mock)
- [ ] Each stakeholder card shows:
  - Avatar + name
  - RACI role badge (Accountable, Responsible, Consulted, Informed)
  - Email
  - Last active timestamp
- [ ] "Add Stakeholder" button:
  - Search company directory (LDAP-backed)
  - Select person + assign RACI role
  - Optional: link to specific document/thread
- [ ] Drag-and-drop to reorder stakeholders
- [ ] Filter by RACI role

### Review Request Flow
- [ ] On draft card: "Request Review" button
- [ ] Opens stakeholder picker (multi-select)
- [ ] Reviewers receive notification (in-app, Phase 1)
- [ ] Reviewer sees draft in read-only mode with "Approve" / "Request Changes" buttons
- [ ] Review comments appear as inline annotations on draft
- [ ] Author sees review status: "2 of 3 approved"

### Permission Visualization
- [ ] Resource cards in Context Panel show permission badges:
  - "Full access" (green)
  - "Read-only" (yellow)
  - "Access denied" (red with request button)
- [ ] Hover on denied resource shows: "You need Finance team access. Request?"

## Technical Notes

**Files to modify:**
- `frontend/src/components/ContextPanel.tsx` — replace mock stakeholders with real data
- `frontend/src/components/ThreadNavigator.tsx` — add project settings gear icon

**New files:**
- `frontend/src/components/ProjectSettingsModal.tsx` — project configuration
- `frontend/src/components/StakeholderPicker.tsx` — person search + RACI assignment
- `frontend/src/components/ReviewRequestModal.tsx` — review workflow

**Backend changes needed:**
- `GET /api/projects/{id}/members` — list members
- `POST /api/projects/{id}/members` — add member
- `DELETE /api/projects/{id}/members/{user_id}` — remove member
- `GET /api/users/search?q=...` — directory search
- `POST /api/documents/{id}/reviews` — request review
- `POST /api/reviews/{id}/respond` — approve/request changes

## Effort: L (4-5 days)

## Dependencies: STORY-UX-001 (Visual Identity)
