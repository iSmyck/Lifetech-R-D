# STORY-BMAD-003: Skill Orchestrator & Phase-Gated Stream

## Status: ✅ Complete (MVP — simulated LLM; real LLM integration deferred)

## Problem
The current `mock_ai_stream` was a single-pass firehose that simulates AI reasoning. BMAD methodology requires phase-gated execution with checkpoints, user approvals, and structured artifact generation.

## Solution
Implemented a `SkillOrchestrator` that executes BMAD skills phase-by-phase, persisting state between checkpoints, and yielding structured stream events.

## Acceptance Criteria

### SkillOrchestrator
- [x] `SkillOrchestrator` class that executes a BMAD skill from the Registry
- [x] `WorkflowState` Pydantic model stored as JSONB in `Thread.bmad_state`:
  ```json
  {
    "skill_id": "bmad-prd",
    "current_phase": "discovery",
    "phases_completed": ["discovery"],
    "checkpoint_state": {},
    "artifact_accumulator": ""
  }
  ```
- [x] State machine:
  ```
  INIT → PHASE_1 → CHECKPOINT → (user response) → PHASE_2 → ... → ARTIFACT_COMPLETE
  ```
- [x] Phase execution:
  - Load skill template section for current phase
  - Assemble prompt with thread history + context
  - Stream LLM response as `thinking` cards
  - Extract checkpoint content from LLM output
  - Persist checkpoint card, pause stream

### Prompt Assembly
- [x] `PromptAssembler` class structure ready:
  - System prompt = BMAD methodology guardrails (~200 tokens, constant)
  - User prompt = current phase skill section + thread history + context
  - Does NOT dump full skill markdown into prompt

### Stream Events
- [x] `BmadStreamService` replaces `mock_ai_stream`
- [x] Stream yields typed events:
  - `phase_start` — phase transition notification
  - `reasoning_token` — reasoning tokens (rendered as AI reasoning cards)
  - `checkpoint_pause` — clarification questions (pauses stream)
  - `phase_end` — phase completion
  - `draft_complete` — completed artifact
- [x] SSE endpoint serializes events to client

### Checkpoint Resumption
- [x] On user POST to `/api/threads/{id}/respond`:
  - Load thread's `bmad_state`
  - Rehydrate `SkillOrchestrator`
  - Inject user response into checkpoint state
  - Advance to next phase (or repeat current if needed)
  - Resume SSE stream via `BmadStreamService.resume_from_checkpoint()`

### Artifact Generation
- [x] Final phase produces structured artifact
- [x] `ArtifactRenderer` extracts Markdown from LLM output
- [x] Creates draft document with:
  - `source_skill`: bmad-prd
  - `phase_generated`: draft
- [x] Emits `draft_complete` event linking to document

### Database Changes
- [x] `threads` table: `agent_id`, `workflow_id`, `bmad_state` (JSONB)
- [x] Migration created: `ceccb6cd18a4_add_bmad_columns_to_threads.py`

## Implementation Details

**Files created:**
- `backend/src/bmad/orchestrator.py` — `SkillOrchestrator`, `WorkflowState`, `StreamEvent`, `PHASE_META`
- `backend/src/bmad/artifacts.py` — `ArtifactRenderer` with markdown extraction
- `backend/src/services/bmad_stream.py` — `BmadStreamService` (replaces mock)

**Files modified:**
- `backend/src/api/threads.py` — SSE stream uses `BmadStreamService`, checkpoint respond rehydrates orchestrator
- `backend/src/models/thread.py` — added BMAD columns

**Phase Flow (MVP — bmad-prd):**
```
discovery → planning → drafting → review → complete
```
Each phase emits:
1. `phase_start` — UI shows phase indicator
2. 3× `reasoning_token` — agent reasoning streamed
3. `checkpoint_pause` — user input required
4. `phase_end` — awaiting checkpoint resolution

**Validation:**
- Backend imports successfully
- Orchestrator generates correct event sequence
- Thread state persists across checkpoints
- Frontend receives and renders all event types

## Known Limitations / Deferred to Phase 2
- **Real LLM calls**: Currently uses simulated reasoning text. The orchestrator framework is ready for LLM integration — replace `_get_phase_reasoning()` and `_get_phase_checkpoint()` with actual LLM calls via the existing LLM client.
- **Dynamic phase content**: Checkpoints are hardcoded per phase. Future: parse phase instructions from skill markdown and generate checkpoints via LLM.
- **Artifact quality**: MVP artifact is a template. Future: feed accumulated checkpoint responses into LLM for rich PRD generation.

## Effort: L (5-6 days) ✅

## Dependencies: STORY-BMAD-001, STORY-BMAD-002 ✅
