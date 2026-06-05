# BMAD Stream Workbench — Phase 1 Sprint Sequence

## Sprint 1: Foundation + Core UI (Weeks 1–2)
**Goal:** A running three-pane layout with mock data.

| Story | Title | Effort | Dependencies |
|-------|-------|--------|--------------|
| STORY-001 | Project Scaffold | S | — |
| STORY-003 | Thread Navigator — Left Pane | M | STORY-001 |
| STORY-004 | Stream Canvas & Intent Bar — Center Pane | L | STORY-001, STORY-003 |

**Exit criteria:** `docker compose up` renders the workbench. User can click threads, type intents, see mock AI responses. All tests pass.

## Sprint 2: Real-Time + Data Model (Weeks 2–3)
**Goal:** Persistent data and SSE streaming.

| Story | Title | Effort | Dependencies |
|-------|-------|--------|--------------|
| STORY-012 | Document & Revision Model | M | STORY-001 |
| STORY-005 | Reasoning Ribbon & SSE Streaming | M | STORY-004 |
| STORY-006 | Clarification Checkpoint | M | STORY-004, STORY-005 |

**Exit criteria:** Intent submission triggers real SSE events. Checkpoints pause the stream and await human input. Data persists in PostgreSQL.

## Sprint 3: Value Delivery — Draft & Approval (Weeks 3–4)
**Goal:** AI-generated drafts that can be edited, approved, and published.

| Story | Title | Effort | Dependencies |
|-------|-------|--------|--------------|
| STORY-007 | Draft Card & Focused Editor | L | STORY-004, STORY-006 |
| STORY-009 | Approval Checkpoint & Publish to KB | M | STORY-007 |
| STORY-011 | Context Panel — Right Pane | M | STORY-003, STORY-007, STORY-010 |

**Exit criteria:** Analyst can generate a PRD draft, edit it in the Focused Editor, approve it, and export Markdown.

## Sprint 4: Infrastructure Hardening (Weeks 4–5)
**Goal:** Authentication, attachments, and AI gateway.

| Story | Title | Effort | Dependencies |
|-------|-------|--------|--------------|
| STORY-010 | Attachment Upload & Processing | L | STORY-001, STORY-004 |
| STORY-002 | Authentication & RBAC | M | STORY-001 |
| STORY-013 | AI Gateway Integration | L | STORY-005, STORY-006 |

**Exit criteria:** LDAP login works. Attachments upload to MinIO and index into pgvector. Real LLM calls flow through LiteLLM proxy.

## Sprint 5: Integrations & Polish (Weeks 5–6)
**Goal:** Corporate resource linking, forking, and observability.

| Story | Title | Effort | Dependencies |
|-------|-------|--------|--------------|
| STORY-014 | Jira/Confluence Read-Only Linking | M | STORY-011 |
| STORY-008 | Inline Forking | M | STORY-007 |
| STORY-015 | Health, Metrics & Admin Dashboard | S | STORY-001 |

**Exit criteria:** Jira/Confluence cards render. Forking preserves audit lineage. `/health`, `/ready`, `/metrics` endpoints operational.

---

## Critical Path

```
STORY-001 → STORY-003 → STORY-004 → STORY-005 → STORY-006 → STORY-007 → STORY-009
```

Stories off the critical path (can parallelize):
- STORY-012 (Document Model) can start alongside STORY-003
- STORY-010 (Attachments) can start in Sprint 2
- STORY-015 (Health/Metrics) can be done any time after STORY-001
