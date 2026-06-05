# STORY-015: Health, Metrics & Admin Dashboard

**Story ID:** STORY-015  
**Title:** Health, Metrics & Admin Dashboard  
**Effort:** S (2–3 days)  
**Dependencies:** STORY-001  

## Description
Implement health/readiness probes, Prometheus metrics endpoint, and a mocked admin dashboard showing workflow throughput, intervention rates, integration health, and active sessions. This is foundational observability for the pilot.

## Acceptance Criteria

### AC-15.1: Health endpoints
- `GET /health` → `{"status": "ok"}` (liveness probe)
- `GET /ready` → checks DB, Redis, MinIO connectivity; returns `200` or `503` with failing component list
- Response time < 100ms for both endpoints

### AC-15.2: Metrics endpoint
- `GET /metrics` → Prometheus exposition format
- Metrics:
  - `http_requests_total` (counter, labeled by method, endpoint, status)
  - `http_request_duration_seconds` (histogram)
  - `active_sse_connections` (gauge)
  - `threads_created_total` (counter, labeled by project)
  - `threads_completed_total` (counter, labeled by project, status)
  - `checkpoints_triggered_total` (counter, labeled by type)

### AC-15.3: Structured logging
- Every API request logged as JSON: `{ "timestamp": "...", "request_id": "...", "user_id": "...", "method": "...", "path": "...", "latency_ms": ..., "status": ... }`
- Request ID propagated via `X-Request-ID` header or generated UUID
- Errors include stack trace in development, omitted in production

### AC-15.4: Admin dashboard (mocked)
- Route: `/admin` (protected, `lead` or `admin` role only)
- Panels:
  - Workflow throughput: threads created / completed per day (mock chart)
  - Intervention rate: % of checkpoints requiring human input (mock stat)
  - Integration health: Jira, Confluence, vLLM status indicators (mock)
  - Active sessions: current SSE connection count (real)
- UI uses Recharts or simple SVG bar charts

### AC-15.5: Audit export
- `GET /api/admin/audit-export?start=...&end=...` → JSON array of `audit_log` entries
- Filterable by `thread_id`, `user_id`, `action`
- Max 10,000 rows per request; pagination with `limit`/`offset`
- Response streamed to avoid memory issues

## PRD References
- §8 Observability (monitoring & observability section)
- FR-17: Authentication & RBAC (admin role)

## System Design References
- §8 Monitoring & Observability (mocked in Phase 1)
- §3.1 Core Entities (`audit_log`)

## Implementation Notes
- Prometheus metrics via `prometheus-fastapi-instrumentator`
- Structured logging via Python `structlog` or custom JSON formatter
- Request ID middleware attaches UUID to every request
- Admin dashboard is a simple React route with mock data; real data wired in Phase 1b
- Role check middleware rejects non-admin access to `/admin` and `/api/admin/*`
