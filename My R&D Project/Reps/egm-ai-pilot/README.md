# EGM AI Multi-Agent Backend (Pilot)

Cultural Marketing Intelligence Platform — Multi-Agent System

## Architecture

```
User Query → Coordinator (WF-01) → Router (WF-02)
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              Localization    Governance      Performance
                 (WF-03)        (WF-04)         (WF-05)
                    ↓               ↓               ↓
                    └───────────────┴───────────────┘
                                    ↓
                          Content Generation (WF-06)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
              Validation (WF-07)              HITL (WF-09)
                    ↓                               ↑
            Return Response                   Human Review
```

## Directory Structure

| Directory | Contents |
|-----------|----------|
| `workflows/` | n8n importable workflow JSON files (WF-01 through WF-09) |
| `prompts/` | System prompts for each agent (Markdown) |
| `schemas/` | JSON Schema definitions for agent input/output validation |
| `skills/` | Modular knowledge packs (cultural-analysis, compliance-screening, etc.) |
| `config/` | Model configs, context management settings, policy red-lines |
| `database/` | PostgreSQL schema with pgvector extension |

## Agents

| Agent | Model | Temperature | Purpose |
|-------|-------|-------------|---------|
| Coordinator | Claude 3.5 Sonnet | 0.3 | Intent classification, orchestration, synthesis |
| Router | Claude 3.5 Haiku | 0.1 | Task decomposition, execution planning |
| Localization | Claude 3.5 Sonnet | 0.5 | Cultural analysis, market adaptation |
| Governance | Claude 3.5 Sonnet | 0.1 | Compliance screening, red-line enforcement |
| Performance | Claude 3.5 Haiku | 0.2 | Media strategy, platform optimization |
| Content | Claude 3.5 Sonnet | 0.7 | Marketing copy, creative generation |
| Validation | Claude 3.5 Haiku | 0.0 | Cross-agent consistency, risk aggregation |

## Quick Start (n8n)

1. Start n8n: `docker compose --profile n8n up n8n`
2. Open n8n at `http://localhost:5678`
3. Import workflows from `workflows/` directory
4. Configure AWS Bedrock credentials for Claude access
5. Configure PostgreSQL credentials

## Quick Start (Python Backend)

```bash
# Install dependencies
cd backend
pip install -e ".[dev]"

# Start PostgreSQL
docker compose up postgres -d

# Run migrations
alembic upgrade head

# Start backend
uvicorn backend.src.main:app --reload --port 8000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/query` | POST | Submit query (async) |
| `/api/v1/query/sync` | POST | Submit query (sync, waits for completion) |
| `/api/v1/query/{id}/status` | GET | Check query status |
| `/api/v1/query/stream/{id}` | GET (SSE) | Stream agent execution events |
| `/api/v1/review/pending` | GET | List pending HITL reviews |
| `/api/v1/review/{id}` | POST | Submit reviewer decision |
| `/api/v1/sessions/{id}` | GET | Get session history |
| `/health` | GET | Health check |

## Test Scenarios

1. **Simple localization**: "Localize product introduction for Hennessy in Nigeria"
2. **Compliance check**: "Check if this ad copy is compliant: 'Our supplement cures diabetes'"
3. **Multi-agent**: "Create social media ad copy for eco-friendly detergent targeting young adults in Kenya, ensuring compliance"
4. **Platform comparison**: "Compare TikTok vs Instagram for luxury brand in South Africa"
5. **Content + Governance**: "Write 3 ad hooks for a fintech app in Ghana, ensuring governance for financial claims"
6. **Red-line trigger**: "Create ad targeting teenagers for our new vodka brand" → should trigger HITL

## Context Management

Each agent has a token budget:
- System prompt: 2000 tokens
- Skills: 1500 tokens
- User input: 1000 tokens
- Conversation history: 500 tokens
- Output reservation: 2000 tokens

Skills are loaded dynamically based on classified intent.

## EGM AI Policy Red-Lines

1. No medical/therapeutic claims
2. No under-21 alcohol targeting
3. No political content during voting periods
4. No sensitive religious/cultural references without review
5. No cross-border personal data processing
6. No biometric/face recognition
7. No financial advice without license
8. No gambling/tobacco
9. No comparative ads where restricted
10. No environmental claims without substantiation

Any red-line violation = automatic HITL flag.
