# BA/SA AI Assistant — Multi-Agent n8n Workflow (Tools + Structured Output)

A multi-agent AI assistant built entirely in n8n for **Business Analysts** and **System Analysts**. Every AI agent uses **native n8n tools** (Jira, pgvector, HTTP) and **structured output parsers** for deterministic, validated results.

## What's New — Tool-Based Architecture

### 🔧 Agents Use Tools
AI agents dynamically call tools during reasoning:
- **Jira Tool** — fetch ticket details when keys are mentioned
- **pgvector Tools** — semantic search over Confluence docs and meeting notes
- **Knowledge Base Tool** — search internal documentation for RAG

### 🛡️ Structured Output (Guardrails)
Every agent has a **Structured Output Parser** connected via `ai_outputParser`:
- Enforces exact JSON schema
- Prevents hallucinated fields
- Code validation node catches parse errors and fills defaults

### 🔄 Validation Layer
After every agent, a **Validate Output** code node:
- Extracts JSON from markdown fences or raw text
- Checks required fields exist
- Fills missing fields with sensible defaults
- Returns `{ valid: true/false, error, ...parsed }`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR CHAT (Primary Entry)                      │
│                                                                             │
│   Chat Trigger → Parse Input → Manage Session → Assemble Context            │
│        → Route by Intent                                                    │
│                                                                             │
│    ┌──────────────────────────┐  ┌──────────────────────────────────────┐   │
│    │     RAG Q&A PATH         │  │     DOCUMENT CREATION PATH           │   │
│    │  (ba-sa-rag-agent.json)  │  │  (ba-sa-document-orchestrator.json)  │   │
│    │                          │  │                                      │   │
│    │  RAG Agent               │  │  Step 1: Input Analyzer              │   │
│    │  ├─ Tool: Search KB      │  │  ├─ Tools: Jira, Confluence, Meeting │   │
│    │  ├─ LLM                  │  │  ├─ Structured Output Parser         │   │
│    │  └─ Validate Response    │  │  └─ Validate Output                  │   │
│    │                          │  │                                      │   │
│    └──────────────────────────┘  │  Step 2: RAG Researcher              │   │
│                                  │  ├─ Tool: Search Knowledge Base      │   │
│                                  │  ├─ Structured Output Parser         │   │
│                                  │  └─ Validate Output                  │   │
│                                  │                                      │   │
│                         GENERAL  │  Step 3: Template Selector           │   │
│                         CHAT     │  ├─ Query: Load Templates (Postgres) │   │
│                                  │  ├─ Structured Output Parser         │   │
│   Window Buffer Memory + LLM     │  └─ Validate Output                  │   │
│   → Natural conversation         │                                      │   │
│                                  │  Step 4: Document Composer           │   │
│                                  │  ├─ Structured Output Parser         │   │
│                                  │  └─ Validate Output                  │   │
│                                  │                                      │   │
│                                  │  Step 5: Diagram Generator           │   │
│                                  │  ├─ Structured Output Parser         │   │
│                                  │  ├─ Validate Diagrams (syntax check) │   │
│                                  │  └─ Kroki HTTP Validation            │   │
│                                  │                                      │   │
│                                  │  Step 6: Document Assembler          │   │
│                                  │  └─ Save Draft (Postgres)            │   │
│                                  └──────────────────────────────────────┘   │
│                                                                             │
│                              HITL REVIEW                                    │
│                                                                             │
│   ├─ Load Draft (Postgres)                                                  │
│   ├─ HITL Editor (AI Agent + Structured Output)                             │
│   ├─ Validate Output                                                        │
│   ├─ Route: Approve → Publish to Wiki.js (HTTP)                             │
│   │         Edit → Update Draft (Postgres)                                  │
│   │         Reject → Discard                                                │
│   └─ Validate Output                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tool Connections Pattern

Every agent that uses tools follows this pattern:

```
                    ┌─────────────────┐
         ┌─────────▶│   AI Agent      │──────────┐
         │          │   + System      │          │
         │          │   Prompt        │          │
         │          └────────┬────────┘          │
         │                   │                   │
    ┌────┴────┐         ┌────┴────┐        ┌────┴────┐
    │  Tool 1 │         │   LLM   │        │Structured│
    │ (Jira)  │         │(OpenAI) │        │ Output  │
    └────┬────┘         └─────────┘        │ Parser  │
         │                                  └─────────┘
    ┌────┴────┐
    │  Tool 2 │
    │(pgvector)│
    └────┬────┘
         │
    ┌────┴────┐
    │Embed.   │
    │(OpenAI) │
    └─────────┘
```

**Connection types:**
- `ai_tool` — tool → agent (agent can call the tool)
- `ai_languageModel` — LLM → agent (agent uses this LLM)
- `ai_outputParser` — parser → agent (agent output is parsed through this)
- `ai_embedding` — embeddings → pgvector (vector store uses these embeddings)
- `ai_memory` — memory → agent (agent remembers conversation)

---

## Workflow Files

### Main Workflows

| File | Description | Tools | Structured Output |
|------|-------------|-------|-------------------|
| `ba-sa-orchestrator-chat.json` | Primary entry point. Routes to RAG, Document, or Chat | Memory + LLM | — |
| `ba-sa-document-orchestrator.json` | Orchestrates 6-step pipeline | — | — |

### Sub-Workflows (All use AI Agent + LLM)

| File | Description | Tools | Structured Output | Validation |
|------|-------------|-------|-------------------|------------|
| `ba-sa-input-analyzer.json` | Analyzes inputs, extracts requirements | Jira, Confluence, Meetings | ✅ JSON schema | ✅ |
| `ba-sa-rag-researcher.json` | Synthesizes research brief | Knowledge Base | ✅ JSON schema | ✅ |
| `ba-sa-rag-agent.json` | Answers questions with citations | Knowledge Base | — (free text) | ✅ |
| `ba-sa-template-selector.json` | Selects best template | Postgres query | ✅ JSON schema | ✅ |
| `ba-sa-document-composer.json` | Writes document sections | — | ✅ JSON schema | ✅ |
| `ba-sa-diagram-generator.json` | Generates Mermaid diagrams | — | ✅ JSON schema | ✅ |
| `ba-sa-document-assembler.json` | Assembles final Markdown | — | — | — |
| `ba-sa-hitl-review.json` | HITL review + publish | — | ✅ JSON schema | ✅ |

---

## Setup

### 1. Database Setup

```bash
psql -U postgres -d egm_ai_pilot -f sql/schema-and-seed.sql
```

### 2. Configure Credentials in n8n

| Credential | Type | Purpose |
|------------|------|---------|
| `OpenAI On-Premise` | OpenAI API | LLM + Embeddings |
| `Postgres Default` | Postgres | Database + pgvector |
| `Jira Default` | Jira Software Cloud | Fetch Jira tickets |
| `Wiki.js API Key` | HTTP Header Auth | Publish to Wiki.js |

### 3. Configure Environment Variables

Copy `.env.example` → `.env`:

```bash
LLM_BASE_URL=http://localhost:8000/v1
LLM_MODEL=gpt-4o
POSTGRES_HOST=localhost
POSTGRES_DB=egm_ai_pilot
JIRA_BASE_URL=https://your-domain.atlassian.net
WIKI_JS_URL=https://wiki.yourcompany.com
KROKI_URL=https://kroki.io
N8N_BASE_URL=http://localhost:5678

# Sub-workflow IDs (set AFTER importing)
WORKFLOW_ID_ORCHESTRATOR_CHAT=<id>
WORKFLOW_ID_RAG_AGENT=<id>
WORKFLOW_ID_INPUT_ANALYZER=<id>
WORKFLOW_ID_RAG_RESEARCHER=<id>
WORKFLOW_ID_TEMPLATE_SELECTOR=<id>
WORKFLOW_ID_DOCUMENT_COMPOSER=<id>
WORKFLOW_ID_DIAGRAM_GENERATOR=<id>
WORKFLOW_ID_DOCUMENT_ASSEMBLER=<id>
WORKFLOW_ID_HITL_REVIEW=<id>
WORKFLOW_ID_DOC_ORCHESTRATOR=<id>
```

### 4. Import Workflows

Import **sub-workflows first**, then **main workflows**.

**Critical:** After importing each workflow, copy its ID from the n8n UI and update `.env`.

### 5. Configure pgvector Tool Nodes

For each `vectorStorePGVector` node in tool mode, set in the n8n UI:
- **Table Name**: `rag_documents`
- **Content Column Name**: `content`
- **Metadata Column Name**: `metadata`
- **Vector Column Name**: `embedding`

---

## Agent Prompts & Structured Output Schemas

### Input Analyzer

**Tools:** Jira, Search Confluence, Search Meetings

**System Prompt:**
> You are an expert Business Analyst. You have access to Jira, Confluence, and meeting notes. Fetch relevant information, then output structured JSON with: analysis, requirements, inputs_summary, recommendations.

**Output Schema:**
```json
{
  "analysis": { "intent_summary", "domain", "scope", "stakeholders", "key_entities", "key_processes" },
  "requirements": { "functional", "non_functional", "constraints", "assumptions" },
  "inputs_summary": { "jira_tickets", "documents_referenced", "themes_identified" },
  "recommendations": { "suggested_doc_type", "suggested_sections", "gaps" }
}
```

### RAG Researcher

**Tools:** Search Knowledge Base

**Output Schema:**
```json
{
  "research_brief": { "topic", "key_apis", "architecture_patterns", "business_rules", "data_models", "security_considerations", "performance_requirements", "integration_points" },
  "gaps": ["string"],
  "confidence": "high|medium|low",
  "sources_consulted": ["string"]
}
```

### RAG Agent

**Tools:** Search Knowledge Base

**Output:** Free-form Markdown with source citations `[1]`, `[2]`, etc.

### Template Selector

**Pre-step:** Postgres query loads templates → passed to agent as context

**Output Schema:**
```json
{
  "selected_template": "string",
  "template_type": "requirements|system_design|api_spec",
  "sections": ["string"],
  "rationale": "string",
  "skipped_sections": ["string"],
  "custom_sections": ["string"]
}
```

### Document Composer

**Output Schema (per section):**
```json
{
  "section_name": "string",
  "content": "markdown",
  "key_points": ["string"],
  "completeness": "complete|partial|incomplete"
}
```

### Diagram Generator

**Output Schema:**
```json
{
  "architecture_diagram": "mermaid",
  "data_flow_diagram": "mermaid",
  "er_diagram": "mermaid",
  "sequence_diagram": "mermaid",
  "validation_status": { "architecture": true|false, "data_flow": true|false, "er": true|false, "sequence": true|false }
}
```

**Validation:** Code node checks for Mermaid keywords (`flowchart`, `erDiagram`, `sequenceDiagram`).

### HITL Review

**Output Schema:**
```json
{
  "action": "edit|approve|reject",
  "updated_content": "markdown",
  "changes_made": ["string"],
  "sections_modified": ["string"],
  "notes": "string"
}
```

---

## Validation Strategy

Every agent with structured output has a **Validate Output** code node that:

1. **Extracts JSON** — handles markdown fences (```json), raw JSON, or JSON embedded in text
2. **Parses** — catches parse errors and returns fallback defaults
3. **Fills defaults** — ensures all required fields exist with empty arrays/strings
4. **Validates types** — checks arrays are arrays, strings are strings
5. **Returns structured result**:
   ```json
   {
     "valid": true|false,
     "error": "error message or null",
     "raw_output": "original output for debugging",
     ...parsed_fields
   }
   ```

**Fallback behavior:** If validation fails, the workflow continues with default/empty values rather than crashing. The user sees a warning and can retry.

---

## Usage

### Chat with Orchestrator Agent

```
User: Hi, I'm working on the payment gateway refactoring
Orchestrator: Hello! I'd be happy to help. What would you like to work on?

User: What APIs are available for payment processing?
Orchestrator: [→ RAG Agent] Here are the payment processing APIs...

User: Can you create a requirements document for this?
Orchestrator: [→ Document Orchestrator] I'll create a requirements spec...
              📄 Document draft created!

User: Approve
Orchestrator: [→ HITL] ✅ Published to Wiki.js!
```

### Supported Document Types

| Type | Trigger Phrases |
|------|----------------|
| Requirements Specification (SRS) | "requirements", "SRS", "specification" |
| System Design Document (SDD) | "system design", "architecture", "SDD" |
| API Specification | "API spec", "API documentation", "endpoints" |

---

## File Structure

```
ba-sa-assistant/
├── ba-sa-orchestrator-chat.json         ← Conversational orchestrator with memory
├── ba-sa-document-orchestrator.json      ← 6-step pipeline orchestrator
├── ba-sa-rag-agent.json                  ← RAG Q&A (Tool: pgvector)
├── ba-sa-input-analyzer.json             ← Input analysis (Tools: Jira, pgvector×2)
├── ba-sa-rag-researcher.json             ← Research synthesis (Tool: pgvector)
├── ba-sa-template-selector.json          ← Template selection (Structured Output)
├── ba-sa-document-composer.json          ← Section composer (Structured Output)
├── ba-sa-diagram-generator.json          ← Diagram gen (Structured Output + Kroki)
├── ba-sa-document-assembler.json         ← Document assembly (Code)
├── ba-sa-hitl-review.json               ← HITL review (Structured Output + Wiki.js)
├── sql/schema-and-seed.sql              ← DB schema + mock data
├── templates/
│   ├── requirements-srs-template.md
│   └── system-design-template.md
├── .env.example                         ← Environment variables
└── README.md                            ← This file
```

---

## Troubleshooting

### "No tools connected" in agent
- Check that tool nodes have `ai_tool` connections to the agent
- Verify credentials are configured for each tool
- In n8n UI, check the agent node shows tool icons

### "Output parser failed"
- The validation node catches this and returns defaults
- Check the `raw_output` field in the validation result for debugging
- The agent prompt may need adjustment to enforce JSON-only output

### pgvector tool returns no results
- Verify `rag_documents` table has data and embeddings
- Check that the embeddings node is connected to the pgvector tool
- Ensure the Postgres credential has access to the vector operations

### Jira tool fails
- Verify Jira credentials and base URL
- Check that mentioned ticket keys exist
- The agent handles missing tickets gracefully

### Sub-workflow not found
- Ensure workflow IDs in `.env` match actual n8n workflow IDs
- Workflow IDs are visible in the n8n URL when editing

---

## License

MIT — Part of the Lifetech R&D project.
