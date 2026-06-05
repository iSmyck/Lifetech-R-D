---
name: prompt-optimizer
description: Use when the user asks to optimize, improve, or rewrite a prompt, or when a task request is vague and needs structured clarification before execution.
---

# Prompt Optimizer

Analyze a draft prompt, critique it, match it to available skills and agents,
and output a complete optimized prompt the user can paste and run.

## When to Use

- User says "optimize this prompt", "improve my prompt", "rewrite this prompt"
- User says "help me write a better prompt for..."
- User says "what's the best way to ask for..."
- User pastes a draft prompt and asks for feedback or enhancement
- User says "I don't know how to prompt for this"
- User explicitly asks for prompt optimization

### Do Not Use When

- User wants the task done directly (just execute it)
- User says "optimize code", "optimize performance" — these are refactoring tasks, not prompt optimization
- User is asking about project configuration
- User says "just do it"

## How It Works

**Advisory only — do not execute the user's task.**

Do NOT write code, create files, run commands, or take any implementation
action. Your ONLY output is an analysis plus an optimized prompt.

If the user says "just do it" or "don't optimize, just execute",
do not switch into implementation mode inside this skill. Tell the user this
skill only produces optimized prompts, and instruct them to make a normal
task request if they want execution instead.

Run this 6-phase pipeline sequentially. Present results using the Output Format below.

### Analysis Pipeline

#### Phase 0: Project Detection

Before analyzing the prompt, detect the current project context:

1. Check if `AGENTS.md` exists in the working directory — read it for project conventions
2. Detect tech stack from project files:
   - `package.json` → Node.js / TypeScript / React / Next.js
   - `go.mod` → Go
   - `pyproject.toml` / `requirements.txt` → Python
   - `Cargo.toml` → Rust
   - `build.gradle` / `pom.xml` → Java / Kotlin
   - `Package.swift` → Swift
   - `Gemfile` → Ruby
   - `composer.json` → PHP
   - `*.csproj` / `*.sln` → .NET
   - `Makefile` / `CMakeLists.txt` → C / C++
3. Note detected tech stack for use in Phase 3 and Phase 4

If no project files are found, skip detection and flag "tech stack unknown" in Phase 4.

#### Phase 1: Intent Detection

Classify the user's task into one or more categories:

| Category | Signal Words | Example |
|----------|-------------|---------|
| New Feature | build, create, add, implement | "Build a login page" |
| Bug Fix | fix, broken, not working, error | "Fix the auth flow" |
| Refactor | refactor, clean up, restructure | "Refactor the API layer" |
| Research | how to, what is, explore, investigate | "How to add SSO" |
| Testing | test, coverage, verify | "Add tests for the cart" |
| Review | review, audit, check | "Review my PR" |
| Documentation | document, update docs | "Update the API docs" |
| Infrastructure | deploy, CI, docker, database | "Set up CI/CD pipeline" |
| Design | design, architecture, plan | "Design the data model" |

#### Phase 2: Scope Assessment

If Phase 0 detected a project, use codebase size as a signal. Otherwise, estimate
from the prompt description alone and mark the estimate as uncertain.

| Scope | Heuristic | Approach |
|-------|-----------|----------|
| TRIVIAL | Single file, < 50 lines | Direct execution |
| LOW | Single component or module | Single skill or focused task |
| MEDIUM | Multiple components, same domain | Plan first, then execute |
| HIGH | Cross-domain, 5+ files | Detailed plan, phased execution |
| EPIC | Multi-session, architectural shift | Blueprint-level planning |

#### Phase 3: Skill Matching

Map intent + scope + tech stack (from Phase 0) to specific project skills.

Available skills in this project:

| Intent | Skills |
|--------|--------|
| New Feature | `agent-scaffold`, `python-backend`, `ui-component-dev`, `orchestration-rules` |
| Bug Fix | `python-patterns`, `agent-architecture-audit` |
| Refactor | `python-patterns`, `backend-patterns`, `agent-architecture-audit` |
| Research | `agentic-os`, `orchestration-rules` |
| Testing | `python-patterns`, `python-backend` |
| Review | `security-guardrails`, `agent-architecture-audit` |
| Documentation | — |
| Infrastructure | `backend-patterns`, `python-patterns` |
| Design | `agentic-os`, `orchestration-rules` |

#### Phase 4: Missing Context Detection

Scan the prompt for missing critical information. Check each item and mark
whether Phase 0 auto-detected it or the user must supply it:

- **Tech stack** — Detected in Phase 0, or must user specify?
- **Target scope** — Files, directories, or modules mentioned?
- **Acceptance criteria** — How to know the task is done?
- **Error handling** — Edge cases and failure modes addressed?
- **Security requirements** — Auth, input validation, secrets?
- **Testing expectations** — Unit, integration, E2E?
- **Performance constraints** — Load, latency, resource limits?
- **UI/UX requirements** — Design specs, responsive, a11y? (if frontend)
- **Database changes** — Schema, migrations, indexes? (if data layer)
- **Existing patterns** — Reference files or conventions to follow?
- **Scope boundaries** — What NOT to do?

**If 3+ critical items are missing**, ask the user up to 3 clarification
questions before generating the optimized prompt. Then incorporate the
answers into the optimized prompt.

#### Phase 5: Workflow Recommendation

Determine where this prompt sits in the development lifecycle:

```
Research → Plan → Implement → Review → Verify → Commit
```

For MEDIUM+ tasks, always start with planning. For EPIC tasks, create a blueprint first.

**Multi-prompt splitting** (for HIGH/EPIC scope):

For tasks that exceed a single session, split into sequential prompts:

- Prompt 1: Research + Plan
- Prompt 2-N: Implement one phase per prompt (each ends with verification)
- Final Prompt: Integration test + review across all phases

## Output Format

Present your analysis in this exact structure. Respond in the same language
as the user's input.

### Section 1: Prompt Diagnosis

**Strengths:** List what the original prompt does well.

**Issues:**

| Issue | Impact | Suggested Fix |
|-------|--------|---------------|
| (problem) | (consequence) | (how to fix) |

**Needs Clarification:** Numbered list of questions the user should answer.
If Phase 0 auto-detected the answer, state it instead of asking.

### Section 2: Recommended Skills & Approach

| Type | Component | Purpose |
|------|-----------|---------|
| Skill | `python-patterns` | Code quality guidance |
| Skill | `security-guardrails` | Pre-implementation security check |
| Agent | (relevant agent name) | Execution or review |

### Section 3: Optimized Prompt — Full Version

Present the complete optimized prompt inside a single fenced code block.
The prompt must be self-contained and ready to copy-paste. Include:

- Clear task description with context
- Tech stack (detected or specified)
- Skill references at the right workflow stages
- Acceptance criteria
- Verification steps
- Scope boundaries (what NOT to do)

### Section 4: Optimized Prompt — Quick Version

A compact version for experienced users. Vary by intent type:

| Intent | Quick Pattern |
|--------|---------------|
| New Feature | Plan → Scaffold agent → Implement → Review → Verify |
| Bug Fix | Reproduce → Fix → Test → Verify |
| Refactor | Plan → Refactor → Review → Verify |
| Research | Search → Synthesize → Document |
| Testing | Write tests → Run → Coverage check |
| Review | Code review → Security check → Sign off |
| EPIC | Blueprint → Phase 1 → Verify → Phase 2 → ... |

### Section 5: Enhancement Rationale

| Enhancement | Reason |
|-------------|--------|
| (what was added) | (why it matters) |

### Footer

> Not what you need? Tell me what to adjust, or make a normal task request
> if you want execution instead of prompt optimization.

## Examples

### Example 1: Vague Prompt (Project Detected)

**User input:**

```
帮我写一个用户登录页面
```

**Phase 0 detects:** `package.json` with React + TypeScript, Vite

**Optimized Prompt (Full):**

```
使用项目现有技术栈（React + TypeScript + Vite）实现用户登录页面。

技术要求：
- 沿用项目现有的组件结构和路由约定
- 表单验证使用项目中已有的验证方案
- 认证方式：沿用项目现有认证方案（如无，默认 JWT）
- 包含：邮箱/密码登录表单、表单验证、错误提示、加载状态、响应式布局

工作流：
1. 先规划组件结构和认证流程，参考现有页面的模式
2. 测试先行：编写登录表单的单元测试
3. 实现登录页面和认证逻辑
4. 审查实现
5. 验证所有测试通过且页面正常渲染

安全要求：
- 密码不明文传输
- 防止暴力破解（rate limiting）
- XSS 防护

验收标准：
- 所有测试通过，覆盖率 80%+
- 页面在移动端和桌面端正常渲染
- 登录成功跳转，失败显示错误信息

不要做：
- 不要实现注册页面
- 不要实现忘记密码功能
- 不要修改现有的路由结构
```

### Example 2: Moderate English Prompt

**User input:**

```
Add a REST API endpoint for user profile updates with validation
```

**Phase 0 detects:** `pyproject.toml` with FastAPI, Pydantic

**Optimized Prompt (Full):**

```
Add a REST API endpoint for user profile updates (PATCH /api/users/{id}).

Tech stack: Python + FastAPI + Pydantic v2 (detected from project)

Requirements:
- PATCH /api/users/{id} — partial update of user profile
- Input validation for fields: name, email, avatar_url, bio
- Auth: require valid token, users can only update own profile
- Return 200 with updated user on success
- Return 422 with validation errors on invalid input
- Return 401/403 for auth failures
- Follow existing API patterns in the codebase

Workflow:
1. Plan the endpoint structure, dependency injection, and validation logic
2. Write tests for success, validation failure, auth failure, not-found
3. Implement following existing handler patterns
4. Review for security and style
5. Run full test suite, confirm no regressions

Do not:
- Modify existing endpoints
- Change the database schema (use existing user table)
- Add new dependencies without checking existing ones first
```

### Example 3: EPIC Project

**User input:**

```
Migrate our monolith to microservices
```

**Optimized Prompt (Full):**

```
Plan and execute: "Migrate monolith to microservices architecture"

Before executing, answer these questions in the plan:
1. Which domain boundaries exist in the current monolith?
2. Which service should be extracted first (lowest coupling)?
3. Communication pattern: REST APIs, gRPC, or event-driven?
4. Database strategy: shared DB initially or database-per-service from start?
5. Deployment target: Kubernetes, Docker Compose, or serverless?

The plan should produce phases like:
- Phase 1: Identify service boundaries and create domain map
- Phase 2: Set up infrastructure (API gateway, CI/CD per service)
- Phase 3: Extract first service (strangler fig pattern)
- Phase 4: Verify with integration tests, then extract next service
- Phase N: Decommission monolith

Each phase = 1 PR, with verification gates between phases.
Use git worktrees for parallel service extraction when dependencies allow.
```

## Related Skills

| Skill | When to Reference |
|-------|-------------------|
| `agentic-os` | Multi-agent runtime design |
| `orchestration-rules` | Wiring agents together |
| `agent-architecture-audit` | Reviewing agent behavior before release |
| `security-guardrails` | Security requirements in prompts |
