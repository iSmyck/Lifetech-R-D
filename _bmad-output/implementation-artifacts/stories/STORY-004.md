# STORY-004: Stream Canvas & Intent Bar — Center Pane

**Story ID:** STORY-004  
**Title:** Stream Canvas & Intent Bar — Center Pane  
**Effort:** L (4–6 days)  
**Dependencies:** STORY-001, STORY-003  

## Description
Build the center pane (55%, fluid) that displays the chronological stream of a thread as vertically stacked cards with 16px gap. Includes the persistent Intent Bar at the bottom for natural language input. Supports auto-scroll, scroll-pause detection, and "Jump to live" button.

## Acceptance Criteria

### AC-4.1: Stream card rendering
- Stream cards are vertically stacked with `gap-4` (16px)
- User intent cards: `bg-slate-800`, 3px right border `border-r-emerald-500`, right-aligned text
- Agent cards: `bg-slate-850`, 3px left border `border-l-indigo-500`, left-aligned text
- Card content supports Markdown rendering for rich text

### AC-4.2: Intent Bar
- Persistent input field fixed at bottom of Stream pane
- Placeholder: "What should I work on?"
- `Enter` submits; `Shift+Enter` inserts newline
- Auto-suggests recent intents from thread history (dropdown)
- Attachment chips appear below input when files are dragged in

### AC-4.3: Auto-scroll behavior
- Stream auto-scrolls to bottom when new cards arrive while user is at bottom
- If user scrolls up > 200px from bottom, auto-scroll pauses
- A floating "Jump to live" button appears when scrolled back
- Clicking "Jump to live" smoothly scrolls to latest card

### AC-4.4: Card types render correctly
- `user_intent`: text content, right-aligned, emerald border
- `ai_reasoning`: operation descriptor, expandable trace, indigo border
- `checkpoint_clarification`: blue-bordered (`#58a6ff`) callout card
- `checkpoint_validation`: draft preview card with action buttons
- `draft`: white card on dark canvas, full Markdown, version badge
- `approval`: green-bordered (`#3fb950`) card with name + timestamp
- `fork`: collapsed v1 label + new attempt below
- `attachment`: file chip with icon, processing/ready/error status

### AC-4.5: Card sequence ordering
- Cards ordered by `sequence_number` ascending
- `GET /api/threads/{id}` returns cards in correct order
- New cards appended with incrementing `sequence_number`

### AC-4.6: Empty stream state
- When thread has no cards: "Start by typing your intent below."
- Intent bar is active and focused

### AC-4.7: Keyboard shortcuts
- `Cmd/Ctrl+K` focuses intent bar
- `Esc` blurs intent bar
- `Cmd/Ctrl+F` opens thread-scoped search (mock in Phase 1, highlights matches)

## PRD References
- FR-1: Three-Pane Layout (Stream pane behavior)
- FR-3: Stream Canvas
- FR-5: Intent Bar
- UJ-1 (intent submission), UJ-2 (draft review), UJ-3 (session resumption)

## System Design References
- §4.2 Threads & Streaming API
- §3.1 Core Entities (`stream_cards`)
- §5 State Machine (Idle → Generating → Paused → Draft Ready)

## Implementation Notes
- `StreamCanvas` component owns scroll container and auto-scroll logic
- `IntentBar` is a sibling or child component
- `useStreamScroll` custom hook manages scroll state and "Jump to live" visibility
- Cards rendered via `StreamCard` switch component based on `card_type`
- Markdown rendering via `react-markdown` + `remark-gfm`
