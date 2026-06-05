# System Design: BMAD Stream Workbench — Phase 1

## 1. Overview

This document provides the technical architecture for the BMAD Stream Workbench Phase 1. It complements the PRD with implementation-level detail: component topology, data model, API contracts, and deployment strategy.

**Target stack:** React 18 + Vite (frontend), FastAPI + Uvicorn (backend), PostgreSQL 15 + pgvector (database), MinIO (object storage), vLLM + LiteLLM (LLM serving), Celery + Redis (async tasks), Docker Compose (deployment).

## 2. Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  React 18 + Vite + Zustand                                   │   │
│  │  EventSource (SSE) → /api/sessions/{id}/stream              │   │
│  │  Dark mode default, keyboard-first, no page transitions      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼ HTTPS (nginx reverse proxy)
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  FastAPI (Uvicorn, async)                                    │   │
│  │  ├── Sessions API (SSE streaming, state machine)            │   │
│  │  ├── Documents API (CRUD, revisions, diff)                  │   │
│  │  ├── Auth API (LDAP integration, JWT tokens)                │   │
│  │  ├── Integrations API (Jira, Confluence read-only)         │   │
│  │  └── Admin API (metrics, audit export — mocked v1)         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Celery Workers (Redis broker)                               │   │
│  │  ├── Attachment parsing (DOCX/PDF → text → embeddings)      │   │
│  │  ├── MoM transcription (faster-whisper, CPU)                │   │
│  │  └── Embedding generation (sentence-transformers → pgvector)│   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  PostgreSQL  │  │  MinIO       │  │  Redis                   │  │
│  │  + pgvector  │  │  (S3-compat) │  │  (Celery broker + cache) │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                      AI LAYER (on-prem)                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  LiteLLM Proxy                                               │   │
│  │  └── Routes to vLLM (GPU node)                              │   │
│  │      └── Llama 3.1 8B Instruct / Mistral 7B Instruct        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Data Model

### 3.1 Core Entities

```sql
-- Users (synced from LDAP, read-only in app)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ldap_dn TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (LDAP group mapped)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ldap_group TEXT NOT NULL, -- maps to AD group for access control
    confluence_space_key TEXT,
    wiki_js_project_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Membership (enforces RBAC)
CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES users(id),
    role TEXT CHECK (role IN ('analyst', 'lead', 'viewer')),
    PRIMARY KEY (project_id, user_id)
);

-- Threads (a single PRD generation session)
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    title TEXT,
    status TEXT CHECK (status IN ('active', 'paused', 'completed', 'aborted')),
    mode TEXT CHECK (mode IN ('human_sovereign', 'continuous_execution')) DEFAULT 'human_sovereign',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stream Cards (every event in the thread)
CREATE TABLE stream_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(id),
    card_type TEXT CHECK (card_type IN (
        'user_intent', 'ai_reasoning', 'checkpoint_clarification',
        'checkpoint_validation', 'draft', 'approval', 'fork', 'attachment'
    )),
    sequence_number INT NOT NULL,
    content JSONB NOT NULL, -- flexible schema per card type
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (PRD identity)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(id),
    project_id UUID REFERENCES projects(id),
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('draft', 'approved', 'published')),
    current_revision_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revisions (immutable snapshots)
CREATE TABLE revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    content TEXT NOT NULL, -- Markdown
    author_type TEXT CHECK (author_type IN ('ai', 'human')),
    author_id UUID REFERENCES users(id), -- NULL for AI
    mode_at_creation TEXT CHECK (mode IN ('human_sovereign', 'continuous_execution')),
    parent_revision_id UUID REFERENCES revisions(id), -- for fork lineage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approvals (non-repudiable)
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_id UUID REFERENCES revisions(id),
    document_id UUID REFERENCES documents(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    signature_placeholder TEXT -- digital signature integration point
);

-- Attachments (MinIO references)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(id),
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    minio_path TEXT NOT NULL,
    size_bytes INT NOT NULL,
    transcription TEXT, -- for audio MoMs
    parsed_text TEXT, -- extracted text for RAG
    embedding VECTOR(384), -- pgvector embedding for semantic search
    status TEXT CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log (append-only, compliance)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(id),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL, -- e.g., 'checkpoint_resolved', 'draft_approved', 'mode_switched'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Indexes

```sql
-- Performance
CREATE INDEX idx_stream_cards_thread_seq ON stream_cards(thread_id, sequence_number);
CREATE INDEX idx_revisions_document ON revisions(document_id, created_at DESC);
CREATE INDEX idx_audit_log_thread ON audit_log(thread_id, created_at DESC);

-- Vector search for attachments
CREATE INDEX idx_attachments_embedding ON attachments USING ivfflat (embedding vector_cosine_ops);

-- Full-text search on parsed attachments
CREATE INDEX idx_attachments_parsed_text ON attachments USING gin(to_tsvector('english', parsed_text));
```

## 4. API Contract (Key Endpoints)

### 4.1 Authentication

```
POST /api/auth/login
  Body: { "username": "sarah.chen", "password": "..." }
  Response: { "access_token": "jwt...", "token_type": "bearer", "projects": [...] }

GET /api/auth/me
  Headers: Authorization: Bearer <jwt>
  Response: { "id": "...", "display_name": "Sarah Chen", "projects": [...] }
```

### 4.2 Threads & Streaming

```
POST /api/threads
  Body: { "project_id": "...", "title": "Q2 Requirements PRD", "initial_intent": "..." }
  Response: { "thread_id": "...", "status": "active" }

GET /api/threads/{id}
  Response: { "id": "...", "title": "...", "status": "...", "cards": [...] }

GET /api/threads/{id}/stream
  Headers: Accept: text/event-stream
  Events:
    - reasoning_token: { "step": "analyzing_requirements", "message": "..." }
    - checkpoint_pause: { "type": "clarification", "question": "...", "options": [...] }
    - draft_complete: { "revision_id": "...", "preview": "..." }
    - approval_recorded: { "approved_by": "...", "timestamp": "..." }

POST /api/threads/{id}/respond
  Body: { "checkpoint_id": "...", "response": "MoSCoW" }
  Response: { "status": "resumed" }
```

### 4.3 Documents & Revisions

```
POST /api/documents
  Body: { "thread_id": "...", "title": "Q2 Requirements PRD" }
  Response: { "document_id": "..." }

GET /api/documents/{id}
  Response: { "id": "...", "title": "...", "current_revision": { "content": "..." } }

POST /api/documents/{id}/revisions
  Body: { "content": "# Q2 Requirements...", "author_type": "human" }
  Response: { "revision_id": "..." }

GET /api/documents/{id}/diff?from=A&to=B
  Response: { "diff": "unified diff text..." }

POST /api/documents/{id}/approve
  Body: { "revision_id": "..." }
  Response: { "approval_id": "...", "approved_at": "..." }

POST /api/documents/{id}/publish
  Body: { "target": "wiki_js", "project_id": "..." }
  Response: { "published_url": "..." }
```

### 4.4 Attachments

```
POST /api/attachments
  Content-Type: multipart/form-data
  Body: { "thread_id": "...", "file": <binary> }
  Response: { "attachment_id": "...", "status": "processing" }

GET /api/attachments/{id}
  Response: { "id": "...", "filename": "...", "status": "ready", "parsed_text": "..." }
```

## 5. State Machine

```
[Thread Lifecycle]

Idle ──(intent submitted)──► Generating ──(checkpoint hit)──► Paused
                               │                              │
                               │(no checkpoint needed)        │(human responds)
                               ▼                              ▼
                          Draft Ready ◄────────────────────── Resuming
                               │
                               │(human approves)
                               ▼
                          Approved ──(publish)──► Published
                               │
                               │(human rejects/challenges)
                               ▼
                          Forking ──(regenerate)──► Generating
```

## 6. Deployment Architecture

### 6.1 Docker Compose (Pilot)

```yaml
# docker-compose.yml (simplified)
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf"]

  frontend:
    build: ./frontend
    # Served by nginx, no exposed port

  api:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/bmad
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
      - LITELLM_URL=http://litellm:4000
    depends_on: [postgres, redis, minio]

  celery_worker:
    build: ./backend
    command: celery -A tasks worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/bmad
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
    depends_on: [postgres, redis, minio]

  postgres:
    image: pgvector/pgvector:pg15
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    environment:
      - POSTGRES_DB=bmad
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes: ["minio_data:/data"]

  litellm:
    image: ghcr.io/berriai/litellm:main
    environment:
      - LITELLM_CONFIG=/app/config.yaml
    volumes: ["./litellm-config.yaml:/app/config.yaml"]
    # Proxy to vLLM on GPU node
```

### 6.2 vLLM (GPU Node)

```bash
# On separate GPU-enabled host/VM
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Meta-Llama-3.1-8B-Instruct \
  --quantization awq \
  --max-model-len 8192 \
  --tensor-parallel-size 1 \
  --port 8000
```

### 6.3 LiteLLM Config

```yaml
# litellm-config.yaml
model_list:
  - model_name: llama-3.1-8b
    litellm_params:
      model: openai/meta-llama/Meta-Llama-3.1-8B-Instruct
      api_base: http://gpu-node:8000/v1
      api_key: "fake-key"

general_settings:
  master_key: "sk-bmad-master"
  proxy_batch_write_at: 60
  alert_to_email: "admin@company.com"
```

## 7. Security & Compliance

| Concern | Implementation |
|---------|---------------|
| Authentication | LDAP bind + JWT tokens (short-lived, 1h) |
| Authorization | Project-scoped RBAC; API filters by project membership |
| Data residency | All data on-prem; zero external egress |
| Audit trail | Append-only `audit_log` table; JSON export for compliance |
| Attachment security | MinIO with project-scoped buckets; no public URLs |
| LLM prompt logging | LiteLLM central logging; all prompts/responses retained |
| Approval non-repudiation | `approvals` table with user ID, timestamp, signature placeholder |

## 8. Monitoring & Observability (Mocked in Phase 1)

| Endpoint | Purpose |
|----------|---------|
| `/health` | Liveness probe |
| `/ready` | Readiness probe (DB, Redis, MinIO reachable) |
| `/metrics` | Prometheus metrics (request latency, error rate, active SSE connections) |

**Admin dashboard (mocked):**
- Workflow throughput (threads created / completed per day)
- Intervention rate (% of checkpoints that require human input vs. continuous execution)
- Integration health (Jira/Confluence API status)
- Active sessions (current SSE connections)

## 9. Open Technical Questions

1. **LDAP schema:** What attributes hold project group membership? (`memberOf`, custom attribute, or group search?)
2. **Confluence write API:** Does the org allow API writes to Confluence, or is Wiki.js migration a hard dependency for "Publish to KB"?
3. **GPU node network:** Can the GPU node (vLLM) communicate with the app server over the corporate network, or does it need a separate VLAN?
4. **Backup strategy:** Is PostgreSQL backup handled by existing DBA processes, or do we need pg_dump scheduling?
