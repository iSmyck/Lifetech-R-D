---
name: python-backend
description: Use when creating FastAPI endpoints, Pydantic models, dependency injection, or backend tests.
---

# Python Backend Patterns

## FastAPI Patterns

- Use `APIRouter` for modular routes; aggregate in `api/router.py`.
- Use `Depends()` for DI; define reusable dependencies in `api/deps.py`.
- Return Pydantic models from endpoints; do not return raw dicts.
- For SSE, use `StreamingResponse` with `media_type="text/event-stream"`.

## Test Structure

- Place tests in `backend/tests/` mirroring `src/` structure.
- Use `pytest-asyncio` for async tests.
- Use `httpx.ASGITransport` + `TestClient` for integration tests.

## Async Patterns

- Prefer `async`/`await` over threading for I/O-bound work.
- Reuse `httpx.AsyncClient` instances; do not create one per request.
- Use `asyncio.gather` for parallel agent execution.
