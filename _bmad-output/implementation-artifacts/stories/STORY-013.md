# STORY-013: AI Gateway Integration

**Story ID:** STORY-013  
**Title:** AI Gateway Integration  
**Effort:** L (4–6 days)  **Dependencies:** STORY-005, STORY-006  

## Description
Integrate the on-prem AI stack: LiteLLM proxy sits between FastAPI and vLLM for key management, request logging, and model swap without code changes. The backend generates PRD drafts via structured prompts, surfaces reasoning steps as SSE tokens, and handles checkpoint logic. All prompts and responses logged centrally for audit.

## Acceptance Criteria

### AC-13.1: LiteLLM proxy connectivity
- Backend can reach LiteLLM proxy at `LITELLM_URL` (configured via env)
- Health check: `GET {LITELLM_URL}/health` returns success
- Backend uses `httpx.AsyncClient` for all LLM calls

### AC-13.2: LLM client abstraction
- `backend/src/core/llm_client.py` provides async interface:
  - `generate(prompt: str, system_prompt: str | None = None, stream: bool = False) -> AsyncIterator[str] | str`
  - Handles retry with exponential backoff (max 3 retries)
  - Logs all prompts and responses to structured logger
  - Raises typed `LLMError` on failure

### AC-13.3: PRD generation pipeline
- `POST /api/threads/{id}/generate` triggers PRD generation (called internally on intent submission)
- Pipeline stages:
  1. Intent analysis (extract goals, constraints, stakeholders)
  2. Context retrieval (RAG from attachments, Jira/Confluence)
  3. Clarification checkpoint (if confidence < threshold)
  4. Draft generation (structured Markdown PRD)
  5. Validation checkpoint (present draft)
- Each stage emits SSE `reasoning_token` events

### AC-13.4: Structured generation
- PRD output follows a fixed Markdown template with sections:
  - Executive Summary, Goals, Non-Goals, Requirements, Acceptance Criteria, Stakeholders, Timeline
- Backend sends JSON schema or system prompt enforcing structure
- If model output deviates, backend retries once with stronger prompt

### AC-13.5: Checkpoint logic
- Clarification Checkpoint triggered when:
  - Intent is ambiguous (multiple possible interpretations)
  - Missing critical context (no stakeholder list, no timeline constraint)
  - Attachment referenced but not found
- Confidence threshold: 0.7 (configurable via `CHECKPOINT_CONFIDENCE_THRESHOLD`)
- Validation Checkpoint always triggered after draft generation

### AC-13.6: Prompt logging
- Every prompt and response logged to `audit_log` with `action: "llm_interaction"`
- Details include: model name, prompt tokens, completion tokens, latency ms
- LiteLLM central logging also retains all prompts/responses
- Logs are append-only, retained for compliance period (default 7 years)

### AC-13.7: Mock AI mode
- Environment variable `MOCK_AI=true` bypasses real LLM calls
- Mock mode generates deterministic test PRDs based on intent keywords
- Used for frontend development and CI tests
- Mock reasoning tokens emitted at 1 token/sec to simulate latency

## PRD References
- FR-20: AI Gateway
- FR-6: Reasoning Ribbon (reasoning tokens)
- FR-7: Clarification Checkpoint (confidence threshold)
- FR-16: Auto-Resolve Behavior (checkpoint logic foundation)
- §6.2 Out of Scope: Continuous Execution deferred; human-sovereign only

## System Design References
- §2 Component Architecture (AI Layer)
- §6.3 LiteLLM Config
- §7 Security & Compliance (LLM prompt logging)

## Implementation Notes
- `LLMClient` wraps `httpx.AsyncClient` with retry and logging
- `PRDGenerationService` orchestrates the pipeline stages
- `ReasoningEmitter` class emits SSE events during generation
- Mock mode implemented as `MockLLMClient` subclass for testability
- System prompt templates stored in `backend/src/prompts/prd_generation.txt`
