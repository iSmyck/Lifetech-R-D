# STORY-006: Clarification Checkpoint

**Story ID:** STORY-006  
**Title:** Clarification Checkpoint  
**Effort:** M (3–4 days)  
**Dependencies:** STORY-004, STORY-005  
**Status:** ✅ COMPLETE (Full implementation)

## Description
Implement the Clarification Checkpoint — a human gate where the AI pauses and asks a question. The stream pauses, a distinct callout card appears, and the analyst responds via structured buttons or free-text input. The response becomes a user card in the stream and the AI resumes reasoning.

## What was built

### Backend
- **Thread state machine:** `active` → `paused` (at checkpoint) → `active` (after response)
- `POST /api/threads/{id}/respond` endpoint accepts `{ checkpoint_id, response }`, validates thread state, emits `human_input` SSE event, resumes stream
- **Checkpoint management** in `ThreadStreamManager`:
  - `create_checkpoint()` — generates checkpoint ID, stores asyncio.Event
  - `wait_for_checkpoint()` — blocks mock AI stream until resolved
  - `resolve_checkpoint()` — sets event, publishes human_input
- **Enhanced mock AI stream** (`mock_ai_stream`):
  1. Sends reasoning tokens
  2. Creates checkpoint and emits `checkpoint_pause` with type, question, options
  3. Waits for human response
  4. Emits `human_input` via SSE
  5. Sends more reasoning tokens
  6. Emits `draft_complete`
- `POST /api/threads/{id}/intent` accepts `attachment_ids` and handles thread status transitions

### Frontend
- **StreamCard checkpoint rendering:**
  - Blue-bordered (`#58a6ff`) callout card for `checkpoint_clarification`
  - Structured buttons when `options` provided
  - Free-text textarea with Submit button when no options
  - Enter submits, Shift+Enter for multiline
  - 2000 character max
  - Disables buttons after submission
- **useThreadStream enhancements:**
  - Handles `human_input` event — appends user intent card, shows "Resuming analysis…"
  - `checkpoint_pause` shows "Awaiting your input…" in reasoning ribbon
- **IntentBar:** Includes `attachment_ids` in intent payload (chips with remove)

### Tests
- Backend: 6 checkpoint tests covering respond success, not found, bad thread, missing ID, mock stream flow, SSE human_input event
- Frontend: StreamCard tests for checkpoint buttons, free-text submission, fetch calls

## Acceptance Criteria

### AC-6.1: Checkpoint card renders ✅
- When `checkpoint_pause` event with `type: "clarification"` arrives, a blue-bordered (`#58a6ff`) callout card appears
- Card auto-scrolls into view
- Question text is prominently displayed
- Response options: structured buttons for common answers, or free-text textarea for open questions

### AC-6.2: Structured response buttons ✅
- If event payload includes `options: [...]`, render as horizontal button group
- Each button shows option label
- Clicking a button immediately submits response and disables all buttons
- Selected option becomes a user intent card in the stream

### AC-6.3: Free-text response ✅
- If no options provided, show textarea with "Submit" button
- `Enter` submits; `Shift+Enter` for multiline
- Textarea has max 2000 characters
- Empty submission is blocked with visual validation error

### AC-6.4: Response API ✅
- `POST /api/threads/{id}/respond` body: `{ "checkpoint_id": "...", "response": "..." }`
- Backend validates checkpoint exists and thread is in `paused` state
- On success: returns `{ "status": "resumed" }`; SSE emits `human_input` event
- On invalid checkpoint: returns `404 Not Found`
- On thread not paused: returns `409 Conflict` (relaxed for idempotency)

### AC-6.5: Stream state transition ✅
- After response submission, stream shows new user card with response text
- Reasoning ribbon reappears with "Resuming analysis…"
- Thread state transitions from `paused` to `active`
- No timeout: checkpoint persists indefinitely until responded or thread aborted

### AC-6.6: Checkpoint history ✅
- Resolved checkpoints remain visible in the stream
- Each shows: question, response, timestamp, user name
- Checkpoints are not editable after resolution

## PRD References
- FR-7: Clarification Checkpoint
- FR-3: Stream Canvas (auto-scroll, card types)
- UJ-1 (checkpoint interaction)

## System Design References
- §4.2 Threads & Streaming API (`respond` endpoint)
- §3.1 Core Entities (`stream_cards`, `threads`)
- §5 State Machine (Generating → Paused → Resuming)

## Implementation Notes
- `ClarificationCard` component renders based on `checkpoint_clarification` card type
- `useCheckpointResponse` hook manages submission state and optimistic UI
- Backend state machine enforced in `ThreadService`
- Audit log entry created on every checkpoint resolution
