# STORY-003: Thread Navigator — Left Pane

**Story ID:** STORY-003  
**Title:** Thread Navigator — Left Pane  
**Effort:** M (3–4 days)  
**Dependencies:** STORY-001  

## Description
Build the left pane (20%, 280px min) that lists all threads for the current user, grouped by project. Supports thread creation, status visualization, and in-place loading into the Stream pane. No page transitions.

## Acceptance Criteria

### AC-3.1: Three-pane layout renders
- Left pane occupies 20% width (280px min) of the viewport
- Center pane occupies 55% (fluid)
- Right pane occupies 25% (320px min)
- Panes are separated by draggable resize handles
- Layout proportions persist in `localStorage`

### AC-3.2: Thread list grouped by project
- `GET /api/threads` returns threads scoped to user's projects
- Each project is a collapsible section with project name as header
- Each thread shows: title, last actor (user or agent), relative timestamp, status dot
- Status dots: `active` (green), `paused` (amber), `completed` (blue), `aborted` (red)

### AC-3.3: Thread selection loads stream
- Clicking a thread calls `GET /api/threads/{id}` and populates the Stream pane
- No page reload; stream cards render in-place
- Active thread is highlighted in the navigator with `indigo-500` left border

### AC-3.4: New thread creation
- "New Thread" button at top of left pane
- Click opens inline form: title input + intent textarea
- `POST /api/threads` creates thread; new thread appears at top of its project group
- Thread status initializes as `active`

### AC-3.5: Requirements Package section
- Below active threads, a "Requirements Package" section lists published documents per project
- Documents show: title, approved timestamp, approval badge
- Clicking a document opens a read-only preview in the Context Panel

### AC-3.6: Empty states
- If user has no threads: "No threads yet. Start a new PRD."
- If a project has no threads: project header renders but is collapsed by default

## PRD References
- FR-1: Three-Pane Layout
- FR-2: Thread Navigator
- UJ-1, UJ-3 (thread creation, resumption)

## System Design References
- §4.2 Threads & Streaming API
- §3.1 Core Entities (`threads`, `projects`, `project_members`)

## Implementation Notes
- Frontend uses Zustand for thread list state
- `ThreadNavigator` component with `ProjectGroup` subcomponents
- Status dot colors from Tailwind: `bg-emerald-500`, `bg-amber-500`, `bg-blue-500`, `bg-red-500`
- Dark mode default via Tailwind `dark` class on root
