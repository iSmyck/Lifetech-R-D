---
name: security-guardrails
description: Use before generating code that handles data, API keys, or external calls.
---

# Security Guardrails

## Environment Variables

- All configuration that varies by environment must be loaded from env vars.
- Use Pydantic `BaseSettings` in `backend/src/core/config.py` for validation and defaults.
- Never commit `.env` files. `.env.example` is the only file that should be tracked.

## No Secrets in Source

- Do not hardcode API keys, tokens, passwords, or URLs in Python/TypeScript source files.
- Use placeholder strings in examples and load real values at runtime.

## Input Validation

- Validate every request body, query param, and path variable with Pydantic (backend) or Zod/Yup (frontend).
- Reject unexpected fields (`extra="forbid"` in Pydantic models where appropriate).

## On-Prem Compliance

- Do not add telemetry, analytics, or external SaaS dependencies without explicit approval.
- The only allowed outbound call is to the configured LLM endpoint (`LLM_BASE_URL`).
