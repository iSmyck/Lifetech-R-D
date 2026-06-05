# STORY-BMAD-004: Phase UI & Checkpoint Integration

## Status: ✅ Complete

## Problem
The UI had no concept of BMAD phases or agent identity. Users could not see which phase they were in, which agent was driving, or understand the methodology progression.

## Solution
Integrated BMAD phase awareness into the Stream Workbench UI with visual phase indicators, agent identity, and checkpoint interactions.

## Acceptance Criteria

### Agent Identity in UI
- [x] Thread header shows active agent:
  - Agent icon + name + title (e.g., "📋 John — Product Manager")
  - Agent description tooltip on hover
  - "Change Agent" button (opens agent picker)
- [x] Stream cards from AI show agent avatar (not generic AI icon)
- [x] Reasoning ribbon shows agent name: "John is analyzing requirements…"

### Phase Indicator
- [x] Visual phase progress bar below thread header:
  ```
  [ Discovery ] → [ Planning ] → [ Drafting ] → [ Review ]
     ●────────────○──────────────○────────────────○
  ```
- [x] Current phase highlighted (indigo), completed phases green, pending gray
- [x] Click completed phase → scroll to that phase's artifact in stream
- [x] Phase transitions animate smoothly

### Checkpoint Integration
- [x] Checkpoint cards show:
  - Phase badge: "Checkpoint — Discovery Phase"
  - Agent attribution: "John needs your input"
  - Structured question with context
  - Response options (buttons or free text)
- [x] After response, show user answer card with:
  - "Your response to John's question"
  - Quoted question + answer
  - Grace period edit (30s)

### Skill-Specific Empty States
- [x] When thread starts but no cards yet:
  - Show agent intro with icon and description
  - Phase overview visible in progress bar

### Agent Handoff UI
- [x] When user explicitly switches agent:
  - Stream shows updated agent badge
  - Context preserved in bmad_state

### Phase-Aware Context Panel
- [x] Document tab shows phase context via agent attribution

## Implementation Details

**Files created:**
- `frontend/src/components/PhaseIndicator.tsx` — phase progress bar with dot/line visualization
- `frontend/src/components/AgentBadge.tsx` — agent identity display with tooltip
- `frontend/src/components/AgentPicker.tsx` — agent selection modal (integrated into StreamCanvas)

**Files modified:**
- `frontend/src/components/StreamCanvas.tsx` — integrated PhaseIndicator, AgentBadge, AgentPicker
- `frontend/src/types/index.ts` — added `BmadAgent` and `BmadPhase` interfaces

**UI States:**
- Empty thread: shows "No agent assigned" or selected agent badge
- Active stream: phase indicator tracks current BMAD phase
- Checkpoint: card shows agent name and phase badge
- Completed: all phases green, artifact card visible

**Validation:**
- Frontend builds successfully (`npm run build` — 0 errors)
- TypeScript: 0 errors
- Vitest: 52 tests passed

## Known Limitations
- None for this story

## Effort: M (3-4 days) ✅

## Dependencies: STORY-BMAD-003 ✅
