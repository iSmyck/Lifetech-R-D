# STORY-012: Document & Revision Model

**Story ID:** STORY-012  
**Title:** Document & Revision Model  
**Status:** ✅ Done  
**Effort:** M (3–4 days)  
**Dependencies:** STORY-001  

## Description
Implement the Document and Revision data model with full CRUD API, immutable revision history, diff generation, and append-only audit trail. Every document edit creates a new revision; no revisions are deleted.

## Acceptance Criteria

### AC-12.1: Database schema
- `documents` table: `id`, `thread_id`, `project_id`, `title`, `status`, `current_revision_id`, `created_at`
- `revisions` table: `id`, `document_id`, `content`, `author_type`, `author_id`, `mode_at_creation`, `parent_revision_id`, `created_at`
- `approvals` table: `id`, `revision_id`, `document_id`, `approved_by`, `approved_at`, `signature_placeholder`
- Alembic migrations create all tables with proper foreign keys and indexes

### AC-12.2: Document CRUD API
- `POST /api/documents` → create document, return `document_id`
- `GET /api/documents/{id}` → return document with current revision content
- `PATCH /api/documents/{id}` → update title only (content changes via revisions)
- No `DELETE` endpoint — documents are append-only

### AC-12.3: Revision API
- `POST /api/documents/{id}/revisions` → create revision, update `current_revision_id`
- `GET /api/documents/{id}/revisions` → list all revisions newest-first
- `GET /api/documents/{id}/revisions/{revision_id}` → get specific revision
- Revision `content` is Markdown text, max 100KB

### AC-12.4: Diff generation
- `GET /api/documents/{id}/diff?from=A&to=B` → unified diff text
- Uses Python `difflib.unified_diff` or similar
- If `to` is omitted, diff against `current_revision_id`
- Returns `text/plain` with proper diff headers

### AC-12.5: Revision immutability
- Revisions cannot be modified after creation
- Database has no `UPDATE` trigger on `revisions`; application layer enforces read-only
- Attempting to PATCH a revision returns `405 Method Not Allowed`

### AC-12.6: Audit trail
- Every document creation, revision creation, and approval creates an `audit_log` entry
- `audit_log` fields: `thread_id`, `user_id`, `action`, `details` (JSONB), `created_at`
- Actions: `document_created`, `revision_created`, `draft_approved`, `document_published`
- `GET /api/audit?thread_id=...` returns audit entries for a thread

### AC-12.7: State machine enforcement
- Document status transitions: `draft` → `approved` → `published`
- `approved` requires an `approvals` row
- `published` requires `approved` status
- Invalid transitions return `409 Conflict`

## PRD References
- FR-19: Document & Revision Model
- FR-11: Approval Checkpoint (approvals table)
- UJ-1 (draft creation), UJ-2 (fork lineage)

## System Design References
- §3.1 Core Entities (`documents`, `revisions`, `approvals`, `audit_log`)
- §3.2 Indexes (`idx_revisions_document`)
- §4.3 Documents & Revisions API

## Implementation Notes
- SQLAlchemy models in `backend/src/models/document.py`
- `DocumentService` class enforces state machine and immutability
- Diff endpoint streams large diffs to avoid memory issues
- Audit log entries created via SQLAlchemy event listeners or explicit service calls
