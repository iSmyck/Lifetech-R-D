---
name: ui-component-dev
description: Use when creating frontend components, agent UI cards, chat interfaces, or streaming displays.
---

# UI Component Development

## Component Naming

- Use PascalCase.
- Append the agent name for agent-specific UI: `ResearchAgentCard`, `CoderAgentPanel`.
- Generic components: `ChatInterface`, `StreamLog`, `AgentStatusBadge`.

## SSE Hook Pattern

- Encapsulate `EventSource` logic in custom hooks (e.g., `useAgentStream`).
- The hook should:
  1. Open the SSE connection on mount or trigger.
  2. Parse incoming JSON events.
  3. Update React state incrementally.
  4. Close the connection on cleanup.

## TypeScript Interfaces

- Define interfaces in `frontend/src/types/agent.ts`.
- Keep field names and types in sync with backend Pydantic schemas.
- Export shared types; do not redefine them inline in components.
