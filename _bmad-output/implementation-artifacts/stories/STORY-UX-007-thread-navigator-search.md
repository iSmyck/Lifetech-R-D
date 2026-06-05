# STORY-UX-007: Thread Navigator Search & Organization

## Status: ✅ Done

## Problem
With 10 projects and 20+ threads each, the left pane becomes an unmanageable list. There is no search, filter, or organization. Users must manually scroll to find threads, and there's no way to mark favorites or see recent activity.

## Solution
Implement a fully searchable, filterable, and organizable Thread Navigator with sections, favorites, and smart defaults.

## Acceptance Criteria

### Search
- [ ] Search bar at top of Thread Navigator (sticky)
- [ ] Fuzzy search across:
  - Thread titles
  - Project names
  - Document content (if indexed)
  - Stakeholder names
- [ ] Real-time filtering as user types
- [ ] Clear search button (X)
- [ ] Keyboard shortcut: `/` focuses search bar

### Sections
- [ ] Thread list organized into collapsible sections:
  - **Pinned** — threads marked as favorite (always at top)
  - **Recent** — last 5 accessed threads (auto-populated)
  - **Active** — threads with status "active" or "paused"
  - **Completed** — threads with status "completed" (collapsed by default)
  - **By Project** — traditional project-grouped view (current behavior)
- [ ] Section headers show count: "Active (3)"
- [ ] Click to expand/collapse sections
- [ ] Remember section state in localStorage

### Favorites / Pins
- [ ] Star icon on each thread (hover to reveal)
- [ ] Click to pin/unpin
- [ ] Pinned threads appear in "Pinned" section at top
- [ ] Pin state persisted to backend (`Thread.is_pinned`)

### Sorting & Filtering
- [ ] Sort options (dropdown):
  - Last updated (default)
  - Created date
  - Alphabetical
  - Status
- [ ] Filter chips:
  - Status: Active, Paused, Completed, All
  - Date: Today, This week, This month, All time
  - My threads only
- [ ] Active filters shown as removable pills below search bar

### Recent Activity
- [ ] Each thread shows last activity indicator:
  - "2 min ago" (if < 1 hour)
  - "3 hours ago"
  - "Yesterday"
  - Date for older
- [ ] Small dot indicator if thread has unread checkpoint or draft

### Smart Defaults
- [ ] On load, if user has active threads, expand "Active" section
- [ ] If no active threads, expand "Recent"
- [ ] If completely empty, show onboarding empty state (STORY-UX-002)

## Technical Notes

**Files to modify:**
- `frontend/src/components/ThreadNavigator.tsx` — major refactor for sections and search

**New files:**
- `frontend/src/components/ThreadSearch.tsx` — search input with fuzzy filtering
- `frontend/src/components/ThreadSection.tsx` — collapsible section component
- `frontend/src/components/FilterChips.tsx` — active filter pills
- `frontend/src/hooks/useFuzzySearch.ts` — fuzzy search hook

**Backend changes needed:**
- `GET /api/threads` — support query params: `q`, `status`, `sort`, `pinned`, `limit`
- `PATCH /api/threads/{id}` — support `is_pinned` field

## Effort: M (3-4 days)

## Dependencies: STORY-UX-001 (Visual Identity)
