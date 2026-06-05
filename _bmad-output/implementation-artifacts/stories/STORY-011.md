# STORY-011: Context Panel — Right Pane

**Story ID:** STORY-011  
**Title:** Context Panel — Right Pane  
**Effort:** M (3–4 days)  
**Dependencies:** STORY-003, STORY-007, STORY-010  

## Description
Build the right pane (25%, 320px min) that displays contextual information about the active thread via tabs: Document preview, Stakeholders (RACI), Attachments, and linked Resources (Jira/Confluence). This pane is always visible but content updates when the active thread changes.

## Acceptance Criteria

### AC-11.1: Tab navigation
- Four tabs: "Document", "Stakeholders", "Attachments", "Resources"
- Active tab highlighted with `indigo-500` bottom border
- Tab state persists per thread in Zustand store

### AC-11.2: Document tab
- Live preview of the active draft's current revision
- Rendered Markdown on white card (`bg-white text-slate-900`) within dark panel
- Auto-updates when draft is edited in the Stream
- If no draft exists: "No draft yet. Start a thread to generate a PRD."

### AC-11.3: Stakeholders tab
- Sortable list of stakeholders with RACI tags
- Tags: "Responsible" (green), "Accountable" (blue), "Consulted" (amber), "Informed" (slate)
- Columns: Name, Role, RACI tag, Department
- Sort by name, role, or RACI tag
- If no stakeholders: "No stakeholders identified yet."

### AC-11.4: Attachments tab
- Grid view of attachment chips (filename, type icon, status dot)
- Drag-drop reorder within tab (order persisted in `attachments` table sequence field)
- Clicking opens preview modal with parsed text
- MoMs highlighted with document glyph (`📄`)
- Upload button for direct upload within tab

### AC-11.5: Resources tab
- Read-only cards for linked Jira tickets and Confluence pages
- Each card shows: title, status badge, last-updated timestamp, one-line preview
- Status badges match source system colors
- Click opens source in new tab (never iframe)
- Permission badges: "Full access" (green), "Read-only" (amber), "Access denied" (red)
- If no resources: "No linked resources. Reference Jira tickets or Confluence pages in your intent."

### AC-11.6: Panel resize
- Right pane width is user-resizable via drag handle
- Min width: 320px; max width: 50% of viewport
- Width persisted in `localStorage`

### AC-11.7: Responsive collapse
- On viewports < 1280px, right pane collapses to icon bar
- Clicking icon expands panel overlay style
- On viewports < 1024px, tabs become dropdown selector

## PRD References
- FR-1: Three-Pane Layout (Context Panel proportions)
- FR-4: Context Panel
- FR-14: Corporate Resource Linking

## System Design References
- §3.1 Core Entities (`documents`, `attachments`, `projects`)
- §4.3 Documents API
- §4.4 Attachments API

## Implementation Notes
- `ContextPanel` component with `TabPanel` subcomponents
- `DocumentTab` subscribes to Zustand draft state for live preview
- `StakeholdersTab` uses static mock data in Phase 1 (AI inference of RACI deferred)
- `ResourcesTab` consumes mock Jira/Confluence data until STORY-014 is implemented
- Collapse behavior uses CSS media queries + JavaScript width detection
