---
name: orchestration-rules
description: Use when wiring multiple agents together, creating workflows, or handling agent-to-agent state passing.
---

# Orchestration Rules

## Supervisor Pattern

- A `Supervisor` (orchestrator-level class) decides which agent runs next.
- The supervisor reads shared state and agent outputs; it does not contain business logic.

## Sequential vs Parallel Execution

- **Sequential**: Use when agent B depends on the output of agent A.
- **Parallel**: Use `asyncio.gather` when agents have no inter-dependencies.
- Always validate combined outputs before writing back to shared state.

## Shared State Schema

- All state flowing between agents must conform to the `SharedState` Pydantic model in `orchestrator/state.py`.
- Agents read from and write to the state object; they do not access each other's internals.
- The orchestrator persists state between steps.
