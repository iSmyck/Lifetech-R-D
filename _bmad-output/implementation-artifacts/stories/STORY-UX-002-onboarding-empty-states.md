# STORY-UX-002: Onboarding & Empty States

## Status: ✅ Done

## Problem
New users see empty panes with minimal text like "Start by typing your intent below" and "No threads yet". This is intimidating and provides no guidance on how to begin. First-time abandonment is high when users don't understand the tool's value.

## Solution
Implement guided onboarding flows and rich empty states that educate users and provide clear next actions.

## Acceptance Criteria

### First-Visit Onboarding
- [ ] Detect first visit (localStorage flag `bmad_onboarding_seen`)
- [ ] Show welcome overlay with 3-step visual guide:
  1. "Create a thread for your PRD" (illustration of left pane)
  2. "Tell the AI what you need" (illustration of intent bar)
  3. "Review, edit, and approve" (illustration of draft card)
- [ ] "Get Started" button dismisses overlay and highlights the "New Thread" button with a pulse animation
- [ ] "Skip tour" link available for experienced users
- [ ] Don't show again checkbox

### Thread Navigator Empty State
- [ ] When no projects exist:
  - Show illustration (abstract workspace/plus icon)
  - Title: "Welcome to BMAD Stream Workbench"
  - Subtitle: "Create your first project to start generating PRDs with AI"
  - CTA button: "Create Project" (prominent, primary style)
- [ ] When projects exist but no threads:
  - Show per-project empty state with "New Thread" button
  - Quick template chips: "PRD", "BRD", "User Stories"

### Stream Canvas Empty State
- [ ] When no thread is selected:
  - Large centered illustration
  - Title: "Select a thread to begin"
  - Subtitle: "Or create a new one from the sidebar"
  - CTA: "Create Thread" button
- [ ] When thread is selected but empty (no cards):
  - Title: "Ready to work"
  - Template gallery grid:
    - "Draft PRD from scratch" → opens intent bar focused
    - "Start from Jira ticket" → shows Jira picker (placeholder)
    - "Summarize meeting notes" → prompts for MoM upload
    - "Update existing document" → shows document picker (placeholder)

### Context Panel Empty States
- [ ] Document tab (no draft): "Your PRD will appear here after the AI generates it"
- [ ] Attachments tab (empty): "Drag and drop meeting notes, requirements, or reference docs"
- [ ] Stakeholders tab (empty): "Add stakeholders to assign RACI roles and request reviews"
- [ ] Resources tab (empty): "Link Jira tickets and Confluence pages for context"

### Loading States
- [ ] Replace all "Loading…" text with skeleton shimmer placeholders
- [ ] Thread list: 5 skeleton rows with animated pulse
- [ ] Document preview: skeleton matching PRD structure (title + paragraphs)
- [ ] Attachments: skeleton grid of 4 cards

## Technical Notes

**Files to modify:**
- `frontend/src/components/ThreadNavigator.tsx` — add empty state components
- `frontend/src/components/StreamCanvas.tsx` — add template gallery and empty states
- `frontend/src/components/ContextPanel.tsx` — add tab-specific empty states

**New files:**
- `frontend/src/components/EmptyState.tsx` — reusable empty state component
- `frontend/src/components/OnboardingOverlay.tsx` — first-visit tutorial
- `frontend/src/components/Skeleton.tsx` — skeleton shimmer components

**Dependencies:** None new.

## Effort: M (2-3 days)

## Dependencies: STORY-UX-001 (Visual Identity)
