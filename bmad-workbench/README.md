# BMAD Stream Workbench — Phase 1

AI-assisted PRD generation tool for Product Managers and Business Analysts.

## Quick Start

```bash
# Start infrastructure
docker compose up -d postgres redis minio

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn src.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run test
npm run dev
```

## Project Structure

- `backend/` — FastAPI + Uvicorn + SQLAlchemy async
- `frontend/` — React 18 + Vite + TypeScript + Tailwind CSS + Zustand
- `docker-compose.yml` — Full stack orchestration

## Features

- **BMAD Agent Orchestrator** — Phase-gated orchestration (Discovery → Planning → Drafting → Review) with Intent Classification, Skill Routing, and Checkpoints
- **BMAD Registry** — Loads 16 agents and 84 skills from `_bmad/` configuration
- **LLM Integration** — Auto-detects LM Studio native API at `127.0.0.1:1234`
- **Project & Stakeholder Management** — Full CRUD with RACI assignments
- **Real-time SSE Streams** — Live AI response streaming with checkpoint gates
- **Theme Support** — Dark/light mode with Tailwind

## Testing

### Backend (pytest)

```bash
cd backend
source .venv/bin/activate
pytest                    # All tests (~80 tests)
pytest -q                # Quiet mode
pytest tests/test_bmad_api.py -v   # BMAD registry tests
```

### Frontend Unit (vitest)

```bash
cd frontend
npm test                 # Watch mode
npm run test:run         # CI mode
```

### Frontend E2E (Playwright)

```bash
cd frontend
npm run build            # Required for preview
npx vite preview --port 5175 &
npx playwright test      # Run E2E suite
```

## Architecture

```
Frontend (React 18 + Vite + Tailwind)
├── Pages: App.tsx (single-page layout)
├── Components:
│   ├── IntentBar (user input + classification)
│   ├── ThreadNavigator (thread list + filters)
│   ├── StreamCard (SSE display + checkpoint gate)
│   ├── SettingsModal (LLM config + provider select)
│   └── ContextPanel (project/stakeholder context)
├── State: Zustand (useStore.ts)
└── API: REST + SSE

Backend (FastAPI + SQLAlchemy async)
├── API Layer: FastAPI routers (~50 endpoints)
├── Service Layer: Business logic + LLM client
├── BMAD Engine: IntentClassifier, SkillOrchestrator
├── Models: SQLAlchemy async + Alembic migrations
└── LLM: OpenAI-compatible + LM Studio native API

Infrastructure (Docker Compose)
├── nginx (reverse proxy)
├── frontend (static via nginx)
├── backend (FastAPI + Uvicorn)
├── celery (background tasks)
├── postgres + pgvector (data)
├── redis (caching + pub/sub)
├── minio (S3-compatible storage)
└── litellm proxy + vLLM (LLM routing)
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `LLM_BASE_URL` | `http://127.0.0.1:1234` | LLM API endpoint |
| `LLM_MODEL` | `google/gemma-4-e4b` | Default model |

## BMAD Configuration

Agent and skill definitions are loaded from:
- `_bmad/config.toml` — Global BMAD config
- `_bmad-output/` — Generated artifacts
- `.agents/skills/**/*.md` — Skill definitions
