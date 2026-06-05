# STORY-FLOW-004: LLM Connection Settings

## Status: ✅ Done

## Problem
The application currently connects to LLM via a hardcoded LiteLLM proxy configuration. Users cannot see which model is active, cannot switch models, and cannot configure their own LLM endpoints. For a corporate tool that may use on-prem vLLM, cloud APIs, or local Ollama, this is a critical ops gap.

## Solution
Implement a Settings panel where users (or admins) can configure LLM connections, choose between multiple providers, and test connectivity.

## Supported Providers (Phase 1)

| Provider | Use Case | Connection Method |
|----------|----------|-------------------|
| **Local vLLM** | On-prem GPU, production | OpenAI-compatible API base URL |
| **Ollama** | Local development, testing | Ollama API (localhost:11434) |
| **Kimi Code** | Cloud API, prototyping | API key + base URL |
| **OpenAI** | Fallback cloud | API key |
| **Azure OpenAI** | Enterprise cloud | API key + endpoint + deployment |

## User Flow: Configure LLM Connection

### Entry Point
- Global header → User avatar dropdown → "Settings" → "AI Model" tab

### Step 1 — Open Settings
- User clicks avatar → "Settings"
- Settings modal opens with tabs: Profile, Appearance, AI Model, Integrations, Advanced

### Step 2 — AI Model Tab
- Shows current connection status:
  ```
  ┌─────────────────────────────────────────────────────┐
  │ AI Model Configuration                              │
  ├─────────────────────────────────────────────────────┤
  │                                                     │
  │  Status:  🟢 Connected (vLLM — Llama 3.1 8B)       │
  │  Latency: 145ms  |  Last used: 2 min ago            │
  │                                                     │
  │  Provider: [ Local vLLM  ▼ ]                        │
  │                                                     │
  │  ────────────────────────────────────────────────   │
  │                                                     │
  │  API Base URL                                       │
  │  ┌────────────────────────────────────────────┐    │
  │  │ http://gpu-node:8000/v1                   │    │
  │  └────────────────────────────────────────────┘    │
  │                                                     │
  │  Model Name                                         │
  │  ┌────────────────────────────────────────────┐    │
  │  │ meta-llama/Meta-Llama-3.1-8B-Instruct     │    │
  │  └────────────────────────────────────────────┘    │
  │                                                     │
  │  API Key (optional for local)                       │
  │  ┌────────────────────────────────────────────┐    │
  │  │ •••••••••••••••••••••••••••••••••••••   │    │
  │  └────────────────────────────────────────────┘    │
  │                                                     │
  │  [   Test Connection   ]  [   Save Settings   ]    │
  │                                                     │
  └─────────────────────────────────────────────────────┘
  ```

### Step 3 — Select Provider
- Dropdown shows all providers:
  - Local vLLM
  - Ollama
  - Kimi Code
  - OpenAI
  - Azure OpenAI
- Selecting a provider updates the form fields:

**Ollama fields:**
- Base URL: `http://localhost:11434`
- Model: `llama3.1`, `mistral`, `codellama` (dropdown of installed models)

**Kimi Code fields:**
- Base URL: `https://api.moonshot.cn/v1`
- API Key: required
- Model: `moonshot-v1-8k`, `moonshot-v1-32k`

**OpenAI fields:**
- API Key: required
- Model: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`

### Step 4 — Test Connection
- User clicks "Test Connection"
- Backend sends a simple completion request ("Say 'OK'")
- Shows loading spinner
- Result:
  - 🟢 "Connected! Model: Llama 3.1 8B. Response time: 145ms"
  - 🔴 "Connection failed: Unable to reach endpoint"
  - 🟡 "Connected but model not found: check model name"

### Step 5 — Save
- User clicks "Save Settings"
- Backend stores config in database (per-user or global)
- Toast: "AI model settings saved"
- New settings take effect immediately for next AI request

### Step 6 — Model Info Display
- Global header shows compact model indicator:
  ```
  🧠 Llama 3.1 8B  |  ⚡ 145ms
  ```
- Clicking opens quick-switch dropdown (recently used models)
- Hover shows full connection details tooltip

## Admin vs User Settings

**Admin (settings stored globally):**
- Set default provider for all users
- Restrict which providers users can switch to
- Set API key (users don't see the key, just the provider name)
- View usage metrics: requests/day, tokens consumed, latency trends

**User (settings stored per-user, override global):**
- Switch between allowed providers
- Override model name within provider
- View their own usage

For Phase 1, implement global settings only (single tenant). Per-user overrides in Phase 2.

## UI Specifications

### Settings Modal — AI Model Tab
```
┌─────────────────────────────────────────────────────────┐
│  Settings                                    [✕]        │
├─────────────────┬───────────────────────────────────────┤
│  Profile        │                                       │
│  Appearance     │  AI Model Configuration               │
│  ● AI Model     │                                       │
│  Integrations   │  ┌─────────────────────────────────┐  │
│  Advanced       │  │ 🟢 Connected                    │  │
│                 │  │ vLLM — Llama 3.1 8B Instruct    │  │
│                 │  │ Latency: 145ms                  │  │
│                 │  └─────────────────────────────────┘  │
│                 │                                       │
│                 │  Provider                             │
│                 │  ┌─────────────────────────────────┐  │
│                 │  │ 🔽 Local vLLM                   │  │
│                 │  └─────────────────────────────────┘  │
│                 │                                       │
│                 │  [Provider-specific fields]           │
│                 │                                       │
│                 │  [ Test Connection ]                  │
│                 │                                       │
│                 │  [    Save Settings    ]              │
│                 │                                       │
└─────────────────┴───────────────────────────────────────┘
```

### Quick Model Switcher (Header)
```
┌────────────────────────────┐
│  🧠 Llama 3.1 8B  ▼        │
├────────────────────────────┤
│  Recent                    │
│  ● Llama 3.1 8B (vLLM)     │
│  ○ Mistral 7B (Ollama)     │
│  ───────────────────────── │
│  ⚙️ Configure Models…      │
└────────────────────────────┘
```

## Acceptance Criteria

### Backend
- [ ] `LLMConfig` model: id, provider, base_url, api_key (encrypted), model_name, is_active, created_by
- [ ] `GET /api/settings/llm` — get current active config
- [ ] `POST /api/settings/llm` — save/update config
- [ ] `POST /api/settings/llm/test` — test connection, return latency + model info
- [ ] `GET /api/settings/llm/providers` — list available providers with field schemas
- [ ] API key encryption at rest (Fernet or similar)
- [ ] LiteLLM proxy dynamic reconfiguration (or direct client per provider)
- [ ] Health check endpoint for LLM connection: `GET /api/health/llm`

### Frontend
- [ ] `SettingsModal` component with tab navigation
- [ ] `LLMSettingsTab` component with provider selector, dynamic fields, test button
- [ ] `ModelIndicator` in global header showing active model + quick switcher
- [ ] Connection status badge (green/orange/red dot)
- [ ] Form validation (required fields, URL format)
- [ ] API key masked input (show/hide toggle)

### Security
- [ ] API keys never logged
- [ ] API keys encrypted in database
- [ ] Keys only decrypted server-side for requests
- [ ] Admin-only access to global settings (Phase 1: no RBAC, so all users)

## Technical Notes

**Files to create:**
- `backend/src/models/llm_config.py`
- `backend/src/schemas/llm_config.py`
- `backend/src/services/llm_config_service.py`
- `backend/src/services/llm_clients/` — vllm_client.py, ollama_client.py, kimi_client.py, openai_client.py
- `backend/src/api/settings.py`
- `frontend/src/components/SettingsModal.tsx`
- `frontend/src/components/LLMSettingsTab.tsx`
- `frontend/src/components/ModelIndicator.tsx`
- `frontend/src/hooks/useLLMConfig.ts`

**Files to modify:**
- `backend/src/api/router.py` — add settings router
- `backend/src/services/stream_service.py` — use dynamic LLM config instead of hardcoded
- `frontend/src/App.tsx` — add model indicator to header
- `frontend/src/store/useAppStore.ts` — add settings state

**Dependencies:**
- `cryptography` (Python) for API key encryption
- Provider-specific SDKs (optional — can use HTTP requests)

## Effort: L (4-5 days)

## Dependencies: STORY-UX-001 (Visual Identity), STORY-FLOW-003 (Light/Dark Theme — settings modal shared)
