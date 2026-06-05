# STORY-UX-005: Checkpoint Response Visibility

## Status: ✅ Done

## Problem
When a user responds to a checkpoint, the card collapses to "Response submitted. Awaiting AI to resume…" but never shows WHAT was selected. The user's choice is invisible in the stream, making it impossible to audit their own decisions or understand why the AI proceeded a certain way.

## Solution
Make checkpoint responses permanently visible as user cards in the stream, with edit capability within a grace period.

## Acceptance Criteria

### Response Visibility
- [ ] After user submits a checkpoint response, a new `user_intent` card appears in the stream showing:
  - Question that was asked (quoted, smaller text)
  - User's answer (prominent)
  - Timestamp
  - "Edit (30s)" link if within grace period
- [ ] Card styling: emerald right-border, right-aligned, distinct from initial intent cards
- [ ] Icon indicating it's a checkpoint response (not a new intent): ↩️ or similar

### Grace Period Edit
- [ ] For 30 seconds after submission, show "Edit" link on response card
- [ ] Clicking "Edit" re-opens the checkpoint input inline (transforms card back to input mode)
- [ ] After 30 seconds, card becomes immutable (no edit link)
- [ ] Backend supports updating a checkpoint response if within grace period

### Checkpoint History
- [ ] Each checkpoint card shows a subtle "Responses: 1" indicator
- [ ] If user edited their response, show "Responses: 2 (edited)"
- [ ] Clicking indicator shows history dropdown: "First: MoSCoW at 14:32 → Edited to: RICE at 14:33"

### Visual Flow
- [ ] User sees checkpoint question (blue card)
- [ ] User submits answer
- [ ] Checkpoint card transforms to "Answered" state (collapses, muted)
- [ ] New user response card appears below
- [ ] AI reasoning resumes below user response
- [ ] Clear visual timeline: Question → Answer → Next reasoning → Draft

### Accessibility
- [ ] Screen reader announces: "Checkpoint answered. You selected: MoSCoW"
- [ ] Keyboard: Tab to options, Enter to select, Shift+Enter for multiline text

## Technical Notes

**Files to modify:**
- `frontend/src/components/StreamCard.tsx` — add checkpoint response card type
- `frontend/src/components/CheckpointCardContent.tsx` — handle edit mode and grace period
- `frontend/src/hooks/useThreadStream.ts` — emit `checkpoint_response` event

**New files:**
- `frontend/src/components/CheckpointResponseCard.tsx` — response display card

**Backend:**
- `POST /api/threads/{id}/respond` — support idempotent updates within grace period
- Store checkpoint responses as stream cards with `card_type: 'checkpoint_response'`

## Effort: M (2-3 days)

## Dependencies: None
