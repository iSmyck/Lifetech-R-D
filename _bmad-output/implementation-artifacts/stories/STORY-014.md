# STORY-014: Jira/Confluence Read-Only Linking

**Story ID:** STORY-014  
**Title:** Jira/Confluence Read-Only Linking  
**Effort:** M (3–4 days)  
**Dependencies:** STORY-011  

## Description
Implement read-only linking to corporate Jira tickets and Confluence pages. Resource cards appear in the Context Panel's Resources tab and can be referenced in intents. The AI fetches cached snapshots server-side for inline context; the browser never talks directly to Jira/Confluence.

## Acceptance Criteria

### AC-14.1: Resource card rendering
- Jira cards: ticket key, title, status (color-coded), assignee avatar, priority, last-updated
- Confluence cards: page title, space key, author, last-updated, one-line preview
- Cards are clickable and open source in new tab
- Permission badge: "Full access", "Read-only", or "Access denied"

### AC-14.2: Resource linking API
- `GET /api/integrations/jira/{ticket_key}` → cached ticket data
- `GET /api/integrations/confluence/{page_id}` → cached page data
- `GET /api/integrations/search?query=...&type=jira|confluence` → search results
- All endpoints return `403` if user's LDAP group lacks access to the project

### AC-14.3: Server-side caching
- Backend caches Jira/Confluence API responses in Redis with 5-minute TTL
- Cache key: `jira:{ticket_key}:{project_id}` or `confluence:{page_id}:{project_id}`
- On cache miss, backend calls Jira/Confluence REST API with service account
- On API failure, returns stale cache if available, else `502 Bad Gateway`

### AC-14.4: Intent referencing
- Analyst can reference resources naturally: "Use Jira PROD-442 and Confluence page 12345"
- RAG layer resolves references by searching attachment embeddings + cached resource text
- Referenced resources are automatically linked to the thread (appear in Resources tab)

### AC-14.5: Resource sync
- Background Celery task syncs linked resources every 15 minutes
- Updates cached snapshots if source changed
- Creates `audit_log` entry on sync: `action: "resource_synced"`

### AC-14.6: Mock mode
- If Jira/Confluence credentials not configured, endpoints return mock data
- Mock data is deterministic based on ticket key / page ID
- UI indicates "Demo mode" with subtle banner in Resources tab

## PRD References
- FR-14: Corporate Resource Linking
- FR-4: Context Panel (Resources tab)
- UJ-1 (Jira + Confluence context)

## System Design References
- §4.1 Integrations API
- §3.1 Core Entities (`projects.confluence_space_key`)
- §8 Performance (caching strategy)

## Implementation Notes
- `JiraClient` and `ConfluenceClient` classes in `backend/src/integrations/`
- Redis cache-aside pattern for snapshot caching
- Service account credentials from environment variables (not user LDAP)
- Frontend `ResourcesTab` consumes `useResources` hook
- Mock data generation based on hash of ticket key for consistency
