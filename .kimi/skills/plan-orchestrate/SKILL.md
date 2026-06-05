---
name: plan-orchestrate
description: Use when the user has a multi-step plan document and wants to decompose it into orchestrated agent chains, or when designing workflows that wire multiple agents together through the orchestrator.
---

# Plan Orchestrate

Bridge a plan document to executable agent chains by decomposing it into steps,
tagging each step by intent, and designing per-step agent/skill assignments.
This skill is generative only — it designs the orchestration but does not
execute it. The user implements the orchestration using the orchestrator engine.

## When to Activate

- User has a multi-step plan document (PRD, RFC, implementation plan) and wants to drive it through the orchestrator
- User says "orchestrate this plan", "design agent chains for each step", "compose chains for this plan"
- A step-by-step plan exists but the user does not want to manually pick agents/skills per step

Skip when:

- The work is one ad-hoc step → use a single agent directly
- The plan is unreadable or empty

## Inputs

```
<plan-doc-path> [--scope=all|step:<n>|range:<a>-<b>] [--dry-run]
```

- `<plan-doc-path>` — required; relative or absolute path
- `--scope` — limits emitted steps; defaults to `all`
- `--dry-run` — print decomposition + chain rationale only; do not emit final assignments

## Available Skill & Agent Catalogue

Pick from the project's registered skills and agent types:

**Skills:**

| Skill | Purpose |
|-------|---------|
| `python-backend` | FastAPI endpoints, Pydantic models, dependency injection |
| `python-patterns` | Python idioms, type hints, refactoring |
| `agent-scaffold` | Creating/modifying agents, tools, BaseAgent subclasses |
| `orchestration-rules` | Wiring agents together, workflows, shared state |
| `ui-component-dev` | React components, SSE hooks, TypeScript interfaces |
| `security-guardrails` | Env vars, input validation, on-prem compliance |
| `agent-architecture-audit` | Debugging wrapper regressions, memory contamination |
| `agentic-os` | Multi-agent runtime architecture, kernel routing |
| `backend-patterns` | Repository/service layers, caching, rate limiting |
| `prompt-optimizer` | Optimizing prompts before execution |

**Agent Types (BaseAgent subclasses):**

| Agent | Role |
|-------|------|
| `planner` | Requirement restatement, risk decomposition, step planning |
| `architect` | Architecture, system design, refactor proposals |
| `implementer` | Write code following TDD or plan specs |
| `code-reviewer` | Generic code review |
| `security-reviewer` | Security audit, secret leakage checks |
| `refactor-cleaner` | Dead code, duplicates, cleanup |
| `doc-updater` | Documentation, README, AGENTS.md updates |
| `test-runner` | Test orchestration, coverage checks |
| `database-reviewer` | Schema, migration, query performance |

## How It Works

### Phase 0 — Detect Context

1. Read `<plan-doc-path>`. If missing or empty, report and stop.
2. Detect tech stack from project files (`pyproject.toml`, `package.json`, etc.)
3. Read `AGENTS.md` and `.kimi/skills/` to confirm available skills

### Phase 1 — Decompose Steps

Identify "step units" in priority order:

1. Explicit numbering: `## Step N` / `### Phase N` / `## N. ...` / top-level ordered list
2. A "Step" column in a table
3. `---`-separated blocks with verb-led headings
4. Otherwise treat each H2 as one step

Per step extract `id` (1-based), `title` (≤ 80 chars), `intent` (1–3 sentences), `tags`.

### Phase 2 — Tag and Pick Chain

Tag by intent (multi-tag allowed; chain built from primary + stacked secondaries):

| Tag | Trigger Words | Default Chain |
|-----|---------------|---------------|
| `design` | architecture, design, choose, evaluate, RFC | `planner,architect` |
| `plan` | plan, breakdown, milestone | `planner` |
| `impl` | implement, build, add, create, port | `implementer,code-reviewer` |
| `test` | test, coverage, integration | `implementer,test-runner` |
| `refactor` | refactor, cleanup, dedupe, split | `architect,refactor-cleaner,code-reviewer` |
| `migration` | migrate, upgrade, rewrite, port | `architect,implementer,code-reviewer` |
| `db` | schema, migration, index, SQL, Postgres | `database-reviewer,code-reviewer` |
| `security` | encrypt, auth, secret, OWASP, PII | `security-reviewer,code-reviewer` |
| `build` | build, compile, lint failure, CI | `implementer` |
| `docs` | docs, readme, codemap, changelog | `doc-updater` |
| `review` | review, audit, verify | `code-reviewer` |
| `agent` | agent, tool, BaseAgent, scaffold | `agent-scaffold,orchestration-rules` |
| `frontend` | UI, component, React, CSS, page | `ui-component-dev` |
| `backend` | API, endpoint, route, handler | `python-backend,backend-patterns` |

**Chain composition rules:**

1. **Primary tag selection**: when a step matches multiple tags, the **first one in table order** (top of the table = highest priority) is the primary; the rest are secondaries
2. `impl` + `security` → `implementer,code-reviewer,security-reviewer`
3. `impl` + `db` → `implementer,database-reviewer,code-reviewer`
4. `impl` + `frontend` → `implementer,ui-component-dev,code-reviewer`
5. `impl` + `backend` → `implementer,python-backend,code-reviewer`
6. `impl` + `agent` → `agent-scaffold,orchestration-rules,code-reviewer`
7. **Deduplicate** the resulting chain (preserve first occurrence)
8. Chain length ≤ 4 after deduplication. If exceeded, drop weakest tag (`docs` and `lookup` first)
9. Do not pair `planner` and `architect` in an `impl` chain (context waste). Pair them only on `design` steps
10. Steps tagged `impl`, `refactor`, or `migration` end with a **reviewer-class** agent (`code-reviewer`, `security-reviewer`, or `database-reviewer`). `test` and `build` steps are gated by their own validators and do not require an additional reviewer

### Phase 3 — Compress Task Description

Each step's task description must:

- Be self-contained (the first agent does not need the plan document open)
- Start with `[Plan: <path>#step-<id>]`
- Include 1–3 verifiable acceptance criteria
- Include a scope guard (`Out of scope: ...`) **only if the plan declares one for this step**. Inherit verbatim. If the plan has no out-of-scope statement, omit the clause entirely
- Be concise but complete (200–600 characters preferred)

### Phase 4 — Output

Emit a structured orchestration design:

**Output structure:**

```markdown
# Plan-Orchestrate Result

**Plan**: `<path>`
**Lang**: `<detected-or-given>`
**Steps**: <N>
**Scope**: <all | step:n | range:a-b>

## Steps Overview

| # | Title | Tags | Chain |
|---|-------|------|-------|
| 1 | ... | impl, db | implementer,database-reviewer,code-reviewer |
| ... | | | |

---

## Step 1 — <title>

**Intent**: <1–3 sentences>
**Tags**: <a, b>
**Chain Rationale**: <why this chain; which agent closes the loop>
**Skills to Apply**: <skill1>, <skill2>

### Orchestrator Input

```json
{
  "step_id": 1,
  "agents": ["implementer", "database-reviewer", "code-reviewer"],
  "skills": ["python-backend", "backend-patterns"],
  "task": "[Plan: docs/foo.md#step-1] <compressed task description>; Acceptance: <1–3 items>"
}
```
```

> The output describes the orchestration design. The actual execution is done by wiring these into the `OrchestratorEngine` and calling `run_workflow()`.

Append a final "Batch Summary" aggregating every step's orchestrator input in order so the user can implement them all at once. Skip the batch block in overview-only mode.

### Phase 5 — Self-Check

- Every agent in every chain comes from the catalogue
- Each task description includes Acceptance criteria (1–3 items)
- The `Out of scope:` clause is present only when inherited from the plan
- No duplicate agent in any chain after Phase 2 dedup
- Chain length ≤ 4
- Steps tagged `impl`/`refactor`/`migration` end with a reviewer-class agent. `test` and `build` are exempt
- Zero-tag steps emit `code-reviewer` with rationale `no tag matched; default review-only chain`

## Edge Cases

- **No clear steps**: prefer H2/H3 splitting; if still ambiguous, report "no structured steps detected" with the document outline and ask the user to confirm running by outline
- **Large plan (>1500 lines)**: enter overview-only mode — emit only the overview table and ask the user to narrow with `--scope` before re-running for details
- **Step too broad** (e.g. "complete all backend work"): do not force a single chain. Suggest splitting into N.a and N.b and propose a split
- **Polyglot project**: set `lang=unknown`; map to generic agents. Mention the fallback under "Chain rationale"

## Examples

### Example 1 — Python Plan

Input:

```
plan-orchestrate docs/plan/example-feature.md
```

Excerpt of expected output:

```markdown
## Step 2 — Encrypt sensitive UserProfile fields

**Intent**: Introduce an `EncryptedString` SQLAlchemy type and AES-GCM encrypt `birth_datetime` / `location` before persistence; load the key from an environment variable.
**Tags**: impl, security, db
**Chain Rationale**: Security-sensitive write path, so `security-reviewer` closes the chain; `database-reviewer` validates the migration; `code-reviewer` covers typing and style.
**Skills to Apply**: `python-patterns`, `security-guardrails`, `backend-patterns`

### Orchestrator Input

```json
{
  "step_id": 2,
  "agents": ["implementer", "database-reviewer", "security-reviewer", "code-reviewer"],
  "skills": ["python-patterns", "security-guardrails", "backend-patterns"],
  "task": "[Plan: docs/plan/example-feature.md#step-2] Implement EncryptedString SQLAlchemy type and migrate UserProfile.birth_datetime/location columns; key from ENV APP_DB_KEY; Acceptance: encrypt/decrypt roundtrip tests pass; alembic upgrade/downgrade clean on empty DB; no plaintext in DB after migrate; Out of scope: cross-tenant profile sharing logic"
}
```
```

### Example 2 — Frontend + Backend Plan

Input:

```
plan-orchestrate docs/plan/fullstack-feature.md --scope=range:1-3
```

Step 1 (design) and Step 3 (frontend impl) output:

```markdown
## Step 1 — Design auth flow and data model

**Tags**: design, security
**Chain**: planner,architect,security-reviewer
**Skills**: `agentic-os`, `orchestration-rules`, `security-guardrails`

## Step 3 — Build login React component

**Tags**: impl, frontend, security
**Chain**: implementer,ui-component-dev,security-reviewer
**Skills**: `ui-component-dev`, `security-guardrails`
```

## Notes

- Generative only. Never execute the plan from inside this skill.
- Match the language of the plan document for task descriptions (agent/skill names always remain English)
- The output is designed to be consumed by the `OrchestratorEngine` in `backend/src/orchestrator/engine.py`
