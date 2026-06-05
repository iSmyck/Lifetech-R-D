# STORY-UX-008: Enhanced Intent Bar

## Status: ✅ Done

## Problem
The intent bar is just a textarea with a Send button. It looks like Slack or WhatsApp, not a corporate workbench. There's no quick access to templates, no way to reference corporate resources inline, and no visual indication of what the AI can do.

## Solution
Transform the intent bar into a command center with template chips, resource references, and smart suggestions.

## Acceptance Criteria

### Template Chips
- [ ] Horizontal scrollable row of template chips above the input:
  - "📝 PRD" — pre-fills: "Draft a PRD for [project] that covers..."
  - "📋 BRD" — pre-fills: "Create a business requirements document for..."
  - "👤 User Stories" — pre-fills: "Generate user stories for..."
  - "📊 MoM Summary" — pre-fills: "Summarize the meeting notes about..."
  - "🔄 Update Doc" — pre-fills: "Update the existing PRD for..."
- [ ] Clicking a chip inserts template text into input (cursor positioned at `[...]`)
- [ ] Chips have subtle hover elevation and icon

### Resource References
- [ ] Support mention syntax in intent text:
  - `#jira-123` — references Jira ticket
  - `!confluence-page-name` — references Confluence page
  - `@stakeholder-name` — notifies stakeholder
- [ ] Typing `#` or `!` or `@` shows autocomplete dropdown
- [ ] Referenced items render as styled pills in the input (like GitHub issue references)
- [ ] Selected attachments show as removable chips above input (already partially implemented)

### Smart Suggestions
- [ ] Based on active thread context, suggest next actions:
  - If thread has MoM attachment: "Summarize meeting notes"
  - If thread has no draft: "Generate first draft"
  - If draft exists: "Refine acceptance criteria"
- [ ] Suggestions appear as subtle chips below input: "Try: [Summarize MoM]"

### Enhanced Input
- [ ] Auto-expanding textarea (grows up to 5 lines)
- [ ] Character count: "0/2000" (subtle, turns amber at 1800, red at 2000)
- [ ] Send button transforms to paper airplane icon on hover
- [ ] Disable send when empty or no active thread
- [ ] Placeholder text changes based on context:
  - "What should I work on?" (default)
  - "Ask a follow-up question..." (if thread has cards)
  - "Respond to the checkpoint..." (if checkpoint is active)

### Attachment Zone
- [ ] Expandable attachment zone below input
- [ ] Paperclip icon toggles zone
- [ ] Shows recent attachments from project (quick re-attach)
- [ ] Drag-and-drop overlay when dragging files over the entire intent bar area

### Keyboard Shortcuts
- [ ] `/` — focus intent bar from anywhere
- [ ] `Enter` — send (if not multiline)
- [ ] `Shift+Enter` — new line
- [ ] `Esc` — blur input
- [ ] `↑` (when input empty) — recall last intent

## Technical Notes

**Files to modify:**
- `frontend/src/components/IntentBar.tsx` — major enhancement

**New files:**
- `frontend/src/components/TemplateChips.tsx` — template selector row
- `frontend/src/components/MentionAutocomplete.tsx` — # ! @ autocomplete
- `frontend/src/components/SmartSuggestions.tsx` — context-aware suggestions

**Backend:**
- `GET /api/templates` — list available intent templates
- `GET /api/resources/search?q=...` — Jira/Confluence autocomplete

## Effort: L (4-5 days)

## Dependencies: STORY-UX-001 (Visual Identity)
