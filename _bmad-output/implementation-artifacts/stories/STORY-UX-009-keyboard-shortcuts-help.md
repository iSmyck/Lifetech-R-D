# STORY-UX-009: Keyboard Shortcuts & Help

## Status: ✅ Done

## Problem
Keyboard shortcuts exist in code (`Cmd+K`, `E` for edit, `Esc` for back) but are completely undiscoverable. Users have no way to learn them, and there's no help system for the app. First-time users are left guessing.

## Solution
Implement a comprehensive help system with shortcut cheat sheet, onboarding tour, and contextual tooltips.

## Acceptance Criteria

### Command Palette
- [ ] `Cmd/Ctrl+K` opens command palette (already implemented in hook, add UI trigger)
- [ ] Visual trigger: search icon in global header next to thread title
- [ ] Command palette shows:
  - Recent commands
  - Quick actions: "New Thread", "Search Threads", "Upload Attachment"
  - Navigation: "Go to Projects", "Go to Settings"
  - Help: "Show Shortcuts", "Start Tour"
- [ ] Fuzzy search through commands
- [ ] `Esc` to close

### Shortcuts Cheat Sheet
- [ ] `?` key opens shortcuts modal from anywhere
- [ ] Modal organized by category:
  - **General**: `?` Help, `/` Search, `Cmd+K` Command Palette
  - **Navigation**: `J/K` Prev/Next thread, `N` New thread
  - **Stream**: `E` Edit draft, `R` Respond to checkpoint, `A` Approve draft
  - **Input**: `Enter` Send, `Shift+Enter` New line, `↑` Recall last
- [ ] Show platform-specific keys (Cmd on Mac, Ctrl on Windows)
- [ ] "Print" button for physical reference

### Onboarding Tour
- [ ] 5-step guided tour for first-time users:
  1. "This is your Thread Navigator — all your PRD sessions live here" (highlight left pane)
  2. "The Stream is where you collaborate with AI — watch it think, answer questions, review drafts" (highlight center)
  3. "Context Panel shows your document preview, stakeholders, attachments, and linked resources" (highlight right pane)
  4. "Type your intent here — tell the AI what you need" (highlight intent bar)
  5. "Press ? anytime for help, or Cmd+K for quick actions" (highlight header)
- [ ] Each step has "Next", "Skip", "Back" buttons
- [ tour progress indicator (dots)
- [ ] Don't show again option
- [ ] Can be restarted from Help menu

### Contextual Tooltips
- [ ] All icon buttons show tooltip on hover after 500ms delay
- [ ] Tooltips include shortcut if applicable: "New Thread (N)"
- [ ] First-time hint on complex actions:
  - Hover on checkpoint card: "Click a button or type your answer"
  - Hover on draft card: "Refine, Challenge, or Approve this draft"
  - Hover on attachment: "Click to preview parsed text"

### Help Menu
- [ ] Help button (?) in global header
- [ ] Dropdown menu:
  - "Keyboard Shortcuts"
  - "Take a Tour"
  - "Documentation" (links to PRD)
  - "What's New" (placeholder for changelog)
  - "Report an Issue"

## Technical Notes

**Files to modify:**
- `frontend/src/App.tsx` — add global keyboard listener for `?`
- `frontend/src/components/StreamCanvas.tsx` — add help button in header

**New files:**
- `frontend/src/components/CommandPalette.tsx` — visual command palette
- `frontend/src/components/ShortcutsModal.tsx` — shortcuts cheat sheet
- `frontend/src/components/OnboardingTour.tsx` — guided tour
- `frontend/src/components/Tooltip.tsx` — reusable tooltip component
- `frontend/src/hooks/useKeyboardShortcuts.ts` — global shortcut manager

**Dependencies:**
- `react-hotkeys-hook` or custom implementation

## Effort: M (3 days)

## Dependencies: STORY-UX-001 (Visual Identity), STORY-UX-002 (Onboarding)
