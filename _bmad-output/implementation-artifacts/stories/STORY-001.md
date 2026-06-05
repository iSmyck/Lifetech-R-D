# STORY-001: Project Scaffold — Docker Compose, React Frontend & FastAPI Backend

**Story ID:** STORY-001  
**Title:** Project Scaffold — Docker Compose, React Frontend & FastAPI Backend  
**Effort:** S (2–3 days)  
**Dependencies:** None  

## Description
Establish the foundational project structure: Docker Compose orchestration, Vite + React 18 + TypeScript frontend skeleton, FastAPI + Uvicorn backend skeleton, PostgreSQL 15 + pgvector, Redis, MinIO, and test infrastructure. All containers must start cleanly and the frontend must proxy API calls to the backend in development.

## Acceptance Criteria

### AC-1.1: Docker Compose services start successfully
- `docker compose up --build` brings up: `nginx`, `frontend`, `api`, `celery_worker`, `postgres`, `redis`, `minio`
- Each service reports healthy status via `docker compose ps`
- No port conflicts on `80`, `443`, `5432`, `6379`, `9000`, `9001`

### AC-1.2: Frontend development server runs
- `cd frontend && npm install && npm run dev` serves on `http://localhost:5173`
- HMR (Hot Module Replacement) works: editing `App.tsx` triggers a browser refresh
- TypeScript compilation has zero errors on `npm run build`

### AC-1.3: Backend development server runs
- `cd backend && uvicorn src.main:app --reload --port 8000` serves on `http://localhost:8000`
- `GET /health` returns `{"status": "ok"}`
- `GET /docs` renders Swagger UI with no errors

### AC-1.4: Database connectivity
- Backend connects to PostgreSQL on startup
- Alembic migration directory exists and `alembic upgrade head` runs without error
- pgvector extension is confirmed enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';` returns a row

### AC-1.5: MinIO connectivity
- Backend can list buckets via `minio` Python client
- A test bucket `bmad-dev` is created on first startup if it does not exist

### AC-1.6: Redis connectivity
- Backend can ping Redis via `redis-py`
- Celery worker starts and connects to Redis broker without errors

### AC-1.7: Test infrastructure
- Frontend: `npm run test` runs Vitest with at least one passing placeholder test
- Backend: `pytest` runs with at least one passing placeholder test
- Test directories mirror source directories

## PRD References
- §6.1 "In Scope" — Docker Compose deployment, PostgreSQL + pgvector, MinIO, Redis, Celery
- FR-18: SSE Event Streaming (infrastructure readiness)
- FR-21: Async Job Pipeline (Celery + Redis ready)

## System Design References
- §2 Component Architecture (full stack topology)
- §6.1 Docker Compose (Pilot)
- §6.3 LiteLLM Config (placeholder file created)

## Implementation Notes
- Use `vite@latest` with React + TypeScript template
- Backend uses `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `redis`, `minio`, `celery`, `pytest`, `pytest-asyncio`, `httpx`
- Environment variables loaded via Pydantic Settings in `backend/src/core/config.py`
- Nginx config routes `/api/*` to backend, everything else to frontend
