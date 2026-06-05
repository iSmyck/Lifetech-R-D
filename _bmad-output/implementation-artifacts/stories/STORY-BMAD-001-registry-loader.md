# STORY-BMAD-001: BMAD Registry Loader

## Status: ✅ Complete

## Problem
The backend had no knowledge of the BMAD methodology, agents, or skills installed in the project. The `_bmad/` directory and `.agents/skills/` contain all the configuration, but the workbench could not read them.

## Solution
Implemented a read-only BMAD Registry that parses all BMAD configuration at startup and exposes it to the backend services.

## Acceptance Criteria

### Registry Loading
- [x] `BmadRegistry` class instantiated once as FastAPI dependency singleton
- [x] Startup hook in `main.py` calls `registry.load()`
- [x] Parses `_bmad/config.toml` into Pydantic models:
  - `AgentDefinition`: id, name, title, icon, description, module, team
  - `ModuleConfig`: module name, config values
- [x] Walks `.agents/skills/**/*.md` and extracts YAML frontmatter:
  - `SkillTemplate`: skill_id, name, description, phases, intent_triggers
  - Stores full markdown body for prompt assembly
- [x] Validates cross-references (agent default_skill must resolve to loaded skill)
- [x] In-memory dict storage (no Redis needed — corpus is <5MB)

### Registry API
- [x] `GET /api/bmad/agents` — list all loaded agents with metadata
- [x] `GET /api/bmad/skills` — list all loaded skills with phases
- [x] `GET /api/bmad/skills/{skill_id}` — full skill template with markdown body
- [x] `POST /api/bmad/reload` — dev endpoint to re-parse without restart

### Error Handling
- [x] Missing files logged as warnings, not fatal
- [x] Invalid frontmatter logged with file path
- [x] Registry loads best-effort (partial load OK)

## Implementation Details

**Files created:**
- `backend/src/bmad/__init__.py`
- `backend/src/bmad/registry.py` — `BmadRegistry` with `load()`, `list_agents()`, `list_skills()`, `get_skill()`, `get_agent()`
- `backend/src/bmad/models.py` — Pydantic models (`AgentDefinition`, `SkillTemplate`, `ModuleConfig`, `RegistryOut`)
- `backend/src/api/bmad.py` — Registry API endpoints
- `backend/alembic/versions/ceccb6cd18a4_add_bmad_columns_to_threads.py` — DB migration

**Files modified:**
- `backend/src/main.py` — startup hook loads registry
- `backend/src/api/router.py` — includes bmad router at `/api/bmad`

**Validation:**
- Registry loads 16 agents and 84 skills from project configuration
- All API endpoints respond correctly
- Frontend TypeScript: 0 errors
- Frontend tests: 52 passed

## Known Limitations
- None for this story

## Effort: M (2-3 days) ✅

## Dependencies: None ✅
