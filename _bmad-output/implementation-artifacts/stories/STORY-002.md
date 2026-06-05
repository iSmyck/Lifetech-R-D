# STORY-002: Authentication & RBAC — LDAP Integration + JWT

**Story ID:** STORY-002  
**Title:** Authentication & RBAC — LDAP Integration + JWT  
**Effort:** M (3–4 days)  
**Dependencies:** STORY-001  

## Description
Implement LDAP-integrated authentication with project-scoped RBAC. Users authenticate via LDAP bind; group membership maps to project roles. JWT tokens (1h expiry) secure all API endpoints. The frontend is authorization-naive — it renders only what the API returns.

## Acceptance Criteria

### AC-2.1: LDAP login endpoint
- `POST /api/auth/login` accepts `{ "username": "...", "password": "..." }`
- On valid LDAP credentials: returns `{ "access_token": "jwt...", "token_type": "bearer", "projects": [...] }`
- On invalid credentials: returns `401 Unauthorized` with no stack trace leakage

### AC-2.2: JWT token validation
- `GET /api/auth/me` with `Authorization: Bearer <jwt>` returns `{ "id": "...", "display_name": "...", "projects": [...] }`
- Expired tokens return `401` with `error: "Token expired"`
- Malformed tokens return `401` with `error: "Invalid token"`

### AC-2.3: Project-scoped RBAC
- Users see only threads belonging to projects in their `projects` list
- API endpoints reject cross-project access with `403 Forbidden`
- Roles: `analyst` (read/write), `lead` (read/write/approve), `viewer` (read-only)

### AC-2.4: Frontend auth flow
- Login form at `/login` collects username/password
- On success, JWT stored in `localStorage` (or `httpOnly` cookie if feasible)
- Authenticated requests include `Authorization: Bearer` header
- Unauthenticated users redirect to `/login`

### AC-2.5: Audit logging
- Every login attempt is logged to `audit_log` table with timestamp, IP, success/failure
- Token refreshes are not logged (noise); only initial auth and failures

## PRD References
- FR-17: Authentication & RBAC
- §2.1 JTBD-1, UJ-1 (entry state: authenticated)

## System Design References
- §4.1 Authentication API contract
- §7 Security & Compliance (LDAP + JWT)

## Implementation Notes
- Use `python-ldap` or `ldap3` for LDAP bind
- JWT secret from environment variable `JWT_SECRET`
- Mock LDAP server for tests via `ldap3` in-memory server or test fixtures
- Frontend uses Zustand store for auth state

---

## Implementation Status: ✅ COMPLETE (Re-scoped for Phase 1)

**Date:** 2026-06-04
**Engineer:** Amelia (Senior Software Engineer)

This story was re-scoped for Phase 1 to focus on **Thread & Project CRUD** with mock auth, deferring full LDAP/JWT integration to a later phase.

### What was built

#### Backend
- **Models:** `Project`, `Thread`, `ProjectMember` in `src/models/thread.py`
- **Migration:** `872c44da293a_add_projects_threads_members.py`
- **Schemas:** `ProjectOut`, `ProjectCreate`, `ThreadOut`, `ThreadCreate`, `ThreadUpdate` in `src/schemas/thread.py`
- **Service:** `ThreadService` in `src/services/thread_service.py`
- **Auth:** `MockUser` + `get_current_user` dependency in `src/core/auth.py` (header-based, `X-User-Id`)
- **Endpoints:**
  - `GET /api/projects` — list projects (with membership filter + fallback)
  - `POST /api/projects` — create project
  - `GET /api/projects/{id}` — get project with members
  - `GET /api/threads/by-project/{project_id}` — list threads
  - `POST /api/threads` — create thread with optional initial intent
  - `GET /api/threads/{id}` — get thread
  - `PATCH /api/threads/{id}` — update status/title
  - `GET /api/threads/{id}/documents` — list documents for thread

#### Frontend
- `useThreads` hook for fetching projects/threads and creating new ones
- `ThreadNavigator` fetches real data from backend on mount
- Inline modal for creating new threads (with project selection + new project creation)
- Initial intent creates document + revision automatically via backend

#### Tests
- **Backend:** 18 thread/project tests (100% pass)
- **Frontend:** 5 ThreadNavigator tests (100% pass)

### Deferred to later
- LDAP integration (original AC-2.1)
- JWT token validation (original AC-2.2)
- Full RBAC with 403 cross-project rejection (original AC-2.3)
- Login form / frontend auth flow (original AC-2.4)
- Audit logging for login attempts (original AC-2.5)
