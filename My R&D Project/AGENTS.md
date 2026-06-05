# AGENTS.md — Python Agentic Platform

## Project Overview
- **Name**: Python Agentic Platform with Web UI
- **Type**: Prototype / vibecoding with Kimi Code
- **Goal**: Modular agentic system with a real-time web frontend

## Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI** — HTTP API + Server-Sent Events (SSE)
- **Pydantic v2** — All schemas, config, and validation
- **httpx** — Async HTTP client for LLM calls
- **pytest** — Testing

### Frontend
- **React 18+**
- **TypeScript**
- **Vite** — Build tool
- SSE for agent state streaming

### LLM
- **Kimi API** or on-premise compatible endpoint
- Configurable via environment variables

## Directory Map

```
backend/
  src/
    main.py              # FastAPI factory, app lifespan
    core/
      config.py          # Pydantic Settings, env var loading
      llm_client.py      # Shared async LLM client
      exceptions.py      # Custom exceptions (AgentError, OrchestratorError)
    agents/
      base.py            # Abstract BaseAgent class
      <agent>/           # One directory per concrete agent
    orchestrator/
      engine.py          # Workflow execution engine
      state.py           # Shared state schema and manager
    api/
      router.py          # FastAPI route aggregation
      deps.py            # Dependency injection helpers
frontend/
  src/
    main.tsx             # React entry point
    App.tsx              # Root component
    services/api.ts      # API client (fetch/wrapper)
    hooks/useAgentStream.ts  # SSE hook for agent state streaming
    types/agent.ts       # TypeScript interfaces mirroring Pydantic schemas
```

- `agents/` — Individual agent implementations. Each agent is a self-contained unit with its own tools and logic.
- `orchestrator/` — Workflow engine that wires agents together, handles sequencing, parallelism, and shared state.
- `frontend/` — React UI. Components must map 1:1 to backend agent names where applicable.

## Build Commands

### Backend
```bash
cd backend
uvicorn src.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Python Conventions

1. **Pydantic v2 for all schemas** — Every data structure (request, response, config, state) must be a Pydantic `BaseModel`.
2. **Async/await for all LLM calls** — LLM client and agent `run()` methods must be `async`.
3. **Agent class must inherit from `BaseAgent`** — All agents live in `backend/src/agents/` and extend the abstract base.
4. **No business logic in API layer** — Routes in `api/` are thin. All logic belongs in `agents/` or `orchestrator/`.
5. **Use `httpx.AsyncClient`** for external HTTP calls. Reuse the client from `core.llm_client`.
6. **Raise typed exceptions** — Use custom exceptions from `core.exceptions` instead of generic `Exception`.

## UI Conventions

1. **Agent state streaming via SSE** — The backend emits `text/event-stream` responses. The frontend consumes them via `EventSource`.
2. **Components must match backend agent names** — If the backend has a `ResearchAgent`, the frontend should have a corresponding `ResearchAgentCard` or similar.
3. **TypeScript interfaces mirror Pydantic schemas** — Keep `frontend/src/types/agent.ts` in sync with backend models.
4. **Hook-based data fetching** — Use `useAgentStream` and similar custom hooks; avoid inline fetch in components.

## Security Guardrails

1. **No hardcoded secrets** — All secrets (API keys, tokens, URLs) via environment variables loaded through `core.config`.
2. **No external API calls except configured LLM endpoint** — The LLM client is the only authorized outbound HTTP client.
3. **Input validation at the edge** — Validate all incoming requests with Pydantic before passing to agents.
4. **On-prem compliance** — Do not phone home, do not send telemetry, do not rely on external SaaS for core logic.

## Kimi Skills

Skills are auto-discovered from `.kimi/skills/*/SKILL.md` and guide code generation:

| Skill | When to Use |
|-------|-------------|
| `python-backend` | Creating FastAPI endpoints, Pydantic models, dependency injection, or backend tests |
| `agent-scaffold` | Creating a new agent, modifying agent logic, or adding agent tools |
| `orchestration-rules` | Wiring multiple agents together, creating workflows, or handling agent-to-agent state passing |
| `ui-component-dev` | Creating frontend components, agent UI cards, chat interfaces, or streaming displays |
| `security-guardrails` | Before generating code that handles data, API keys, or external calls |
| `agent-architecture-audit` | Auditing agent behavior, debugging wrapper regressions, memory contamination, tool discipline failures, hidden repair loops, or before releasing any agent feature to production |
| `agentic-os` | Designing multi-agent runtime architecture, kernel routing, specialist agent registries, file-based persistent memory, slash commands, or scheduled automation workflows |
| `backend-patterns` | Designing REST API structure, repository/service layers, caching strategies, error handling, rate limiting, background jobs, or structured logging |
| `python-patterns` | Writing, reviewing, or refactoring Python code, applying type hints, designing packages/modules, or optimizing memory and performance |
| `prompt-optimizer` | Optimizing, improving, or rewriting a prompt, or when a task request is vague and needs structured clarification before execution |
| `plan-orchestrate` | Decomposing a multi-step plan into orchestrated agent chains, or designing workflows that wire multiple agents together through the orchestrator |
| `writing-skills` | Creating new skills, editing existing skills, or verifying skills work before deployment |
| `ui-styling` | Building user interfaces, implementing design systems, creating responsive layouts, adding accessible components, customizing themes and colors, implementing dark mode, or establishing consistent styling patterns |
