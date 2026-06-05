# STORY-005: Reasoning Ribbon & SSE Streaming

**Story ID:** STORY-005  
**Title:** Reasoning Ribbon & SSE Streaming  
**Status:** ✅ Done  
**Effort:** M (3–4 days)  
**Dependencies:** STORY-001, STORY-004  

## Description
Implement Server-Sent Events (SSE) for real-time thread updates from backend to frontend. Build the Reasoning Ribbon UI — a collapsible element with breathing glow indicator, operation descriptor, elapsed time, and expandable trace — that appears during AI thinking phases.

## Acceptance Criteria

### AC-5.1: SSE endpoint delivers events
- `GET /api/threads/{id}/stream` with `Accept: text/event-stream` opens SSE connection
- Event types: `reasoning_token`, `checkpoint_pause`, `human_input`, `draft_complete`, `approval_recorded`
- Each event has `id` field for `Last-Event-ID` recovery
- Connection stays open until thread reaches terminal state or client disconnects

### AC-5.2: Client SSE consumption
- Frontend `useThreadStream` hook opens `EventSource` on thread load
- Hook parses JSON payload from each event and appends to stream state
- Hook auto-reconnects with exponential backoff on disconnect
- On reconnect, sends `Last-Event-ID` header to resume from last received event

### AC-5.3: Reasoning Ribbon UI
- During `reasoning_token` events, a ribbon appears above the active agent card
- Breathing glow: CSS `box-shadow` animation with 3s ease-in-out pulse
- Operation descriptor: one-line text from event payload
- Elapsed time counter increments every second since reasoning started
- Chevron expands/collapses a scrollable trace of reasoning steps
- Trace uses muted monospace font with semantic color tokens

### AC-5.4: Ribbon states
- `generating`: ribbon visible, breathing glow active, timer running
- `checkpoint_pause`: ribbon expands automatically, shows "Awaiting human input"
- `draft_complete`: ribbon transitions to "Draft ready for review" with fade-out after 5s
- `idle`: ribbon hidden

### AC-5.5: SSE resilience
- Backend handles 100+ concurrent SSE connections per worker
- Connection cleanup on client disconnect (no memory leaks)
- Redis pub/sub used to broadcast thread events to all connected clients viewing the same thread

### AC-5.6: Test coverage
- Backend: `test_sse_stream.py` verifies event format and reconnection
- Frontend: `useThreadStream.test.ts` verifies hook state updates and reconnect logic

## PRD References
- FR-3: Stream Canvas (reasoning ribbon behavior)
- FR-6: Reasoning Ribbon
- FR-18: SSE Event Streaming
- UJ-1 (reasoning visualization)

## System Design References
- §4.2 Threads & Streaming API
- §5 State Machine (Generating state)
- §8 Performance (SSE reconnection < 3s)

## Implementation Notes
- Backend uses FastAPI `StreamingResponse` with `media_type="text/event-stream"`
- Redis pub/sub for multi-worker SSE broadcasting
- Breathing glow CSS: `@keyframes breathe { 0%, 100% { box-shadow: 0 0 8px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 20px rgba(99,102,241,0.6); } }`
- Elapsed time via `requestAnimationFrame` or `setInterval` in React
