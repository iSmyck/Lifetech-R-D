---
name: agent-scaffold
description: Use when creating a new agent, modifying agent logic, or adding agent tools.
---

# Agent Scaffolding Guide

## BaseAgent Interface

All agents must inherit from `BaseAgent` defined in `backend/src/agents/base.py`.

### __init__ Signature

```python
def __init__(self, name: str, config: dict | None = None) -> None:
    ...
```

### run() Method Contract

```python
async def run(self, input_data: AgentInput) -> AgentOutput:
    """Execute the agent's main logic.

    Args:
        input_data: Validated Pydantic model specific to this agent.

    Returns:
        A validated AgentOutput Pydantic model.
    """
    ...
```

## Tool Registration Pattern

- Register tools as methods decorated with `@agent_tool` (if a decorator is provided).
- Tools must be async and return plain Python types or Pydantic models.
- Keep tool methods private (`_do_thing`) if they are not meant to be called directly by the orchestrator.

## Error Handling

- Catch domain errors and re-raise as typed `AgentError` from `core.exceptions`.
- Never swallow exceptions silently; log and propagate.
