# STORY-FLOW-001: Resource Linking — Adding Jira & Confluence to Thread Context

## Status: ✅ Done

## User Problem
Analysts need to ground their PRDs in real project context — Jira tickets for requirements traceability, Confluence pages for existing documentation. Currently, the Resources tab shows only 3 hardcoded mock items. There's no way to search, link, or manage real corporate resources.

## Design Principles
1. **Link, don't embed** — Resources open in their native systems (Jira/Confluence), we only store metadata and snapshots
2. **Search-first** — Typing a ticket ID or page name should find it instantly
3. **Contextual relevance** — Linked resources should be visible to the AI during reasoning
4. **Permission-aware** — Show access level (read/write/denied) for each resource

---

## User Flow: Linking a Jira Ticket

### Entry Points
User can link a resource via:
- **A.** Context Panel → Resources tab → "Link Resource" button
- **B.** Intent bar → type `#jira-123` → autocomplete dropdown → select
- **C.** AI suggests link during reasoning → "I found Jira ticket PROD-442 related to this. Link it?" → user clicks ✓

### Flow A: Context Panel (Primary)

**Step 1 — Open Resources Tab**
- User clicks "Resources" tab in Context Panel
- Sees list of already-linked resources (or empty state with "Link Resource" CTA)

**Step 2 — Initiate Linking**
- User clicks "Link Resource" button (primary button, top of tab)
- **Link Resource Modal** opens

**Step 3 — Choose Resource Type**
- Modal shows two large cards:
  - 🔵 **Jira Ticket** — "Link a ticket, epic, or story"
  - 🟣 **Confluence Page** — "Link a documentation page"
- User clicks "Jira Ticket"

**Step 4 — Search Jira**
- Search input focused automatically
- Placeholder: "Type ticket ID (e.g., PROD-442) or keywords…"
- As user types (min 2 chars), backend searches Jira via REST API
- Results appear as cards:
  ```
  ┌────────────────────────────────────────┐
  │ 🔵 PROD-442                             │
  │ OAuth integration for mobile app        │
  │ Status: In Progress  |  Assignee: Bob   │
  │ Updated 2 days ago                      │
  └────────────────────────────────────────┘
  ```
- Each result shows: ticket key, summary, status badge, assignee, last updated

**Step 5 — Select & Confirm**
- User clicks a result card → card highlights with indigo border
- "Link Resource" button becomes active
- Optional: "Include in AI context" checkbox (checked by default)
- User clicks "Link Resource"

**Step 6 — Resource Appears in Context**
- Modal closes
- New resource card appears in Resources tab:
  ```
  ┌────────────────────────────────────────┐
  │ 🔵 Jira    OAuth integration for mob…  │
  │ PROD-442                    [write]    │
  │ In Progress  •  Bob  •  2 days ago     │
  └────────────────────────────────────────┘
  ```
- Toast: "PROD-442 linked successfully"
- Resource is now included in AI context for this thread

**Step 7 — Interact with Resource**
- Clicking the card opens Jira in new tab
- Hover shows tooltip with ticket description preview (first 200 chars)
- "Unlink" button appears on hover (removes from thread context)

---

## User Flow: Linking a Confluence Page

Same as Jira flow, but:
- Search placeholder: "Type page title or space key…"
- Results show: page title, space name, last editor, last updated
- Icon: 🟣 Confluence badge instead of 🔵 Jira

---

## User Flow: Intent Bar Mention (Quick Link)

**Step 1 — Type Mention**
- User types `#` in intent bar
- Autocomplete dropdown appears showing recently linked resources

**Step 2 — Type Ticket ID**
- User types `PROD-442`
- Backend searches Jira
- Matching ticket appears in dropdown

**Step 3 — Select**
- User clicks result or presses Enter
- Ticket reference becomes a styled pill in the input: `#PROD-442`

**Step 4 — Submit Intent**
- User sends intent
- Backend auto-links the resource to the thread if not already linked
- Toast: "PROD-442 linked to this thread"

---

## User Flow: AI Suggested Link

**Step 1 — AI Discovers Resource**
- During reasoning, AI finds a potentially relevant ticket
- Stream shows: "I found Jira ticket PROD-442 that may be related. Link it?"

**Step 2 — User Confirms**
- Two inline buttons: "✓ Link" and "✕ Ignore"
- Clicking "Link" adds resource without opening modal

---

## UI Specifications

### Link Resource Modal
```
┌──────────────────────────────────────────────┐
│  Link Resource                    [✕]        │
├──────────────────────────────────────────────┤
│                                              │
│  [🔵 Jira Ticket ]  [🟣 Confluence Page]     │
│                                              │
│  ─────────────────────────────────────────   │
│                                              │
│  Search Jira tickets                         │
│  ┌──────────────────────────────────────┐   │
│  │ 🔍 PROD-442                          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Results                                     │
│  ┌──────────────────────────────────────┐   │
│  │ 🔵 PROD-442                          │   │
│  │ OAuth integration for mobile app     │   │
│  │ [In Progress]  Bob  2d ago           │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ 🔵 PROD-438                          │   │
│  │ Update auth flow documentation       │   │
│  │ [Done]  Alice  5d ago                │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [✓] Include in AI context                   │
│                                              │
│  [      Link Resource      ]                 │
│                                              │
└──────────────────────────────────────────────┘
```

### Resource Card (in Resources Tab)
```
┌─────────────────────────────────────────────┐
│ 🔵 Jira                        [write] [✕]  │
│ PROD-442: OAuth integration for…            │
│ [In Progress]  •  Bob Martinez  •  2d ago   │
└─────────────────────────────────────────────┘
```

### Empty State (Resources Tab)
```
┌─────────────────────────────────────────────┐
│                                             │
│                    🔗                       │
│                                             │
│      No linked resources yet                │
│                                             │
│   Link Jira tickets and Confluence pages    │
│   to give the AI context about your work    │
│                                             │
│        [   Link Resource   ]                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Backend
- [ ] `GET /api/integrations/jira/search?q=...` — search Jira tickets
- [ ] `GET /api/integrations/confluence/search?q=...` — search Confluence pages
- [ ] `POST /api/threads/{id}/resources` — link resource to thread
- [ ] `GET /api/threads/{id}/resources` — list linked resources
- [ ] `DELETE /api/threads/{id}/resources/{resource_id}` — unlink resource
- [ ] `Resource` model: id, thread_id, type (jira/confluence), external_id, title, status, url, metadata JSON, created_at
- [ ] Jira/Confluence clients with LRU caching (5 min TTL)
- [ ] Resource included in AI context when generating responses

### Frontend
- [ ] `LinkResourceModal` component with type selection, search, results, confirm
- [ ] `ResourceCard` component with hover actions (open, unlink, preview)
- [ ] Intent bar `#` mention autocomplete with resource search
- [ ] Resources tab fetches real data from backend
- [ ] Toast notifications for link/unlink actions
- [ ] Loading skeletons while searching

### AI Integration
- [ ] Linked resources are injected into prompt context
- [ ] AI can suggest linking discovered resources
- [ ] Resource content snapshots cached for AI context

## Technical Notes

**Files to create:**
- `backend/src/models/resource.py`
- `backend/src/schemas/resource.py`
- `backend/src/services/jira_client.py`
- `backend/src/services/confluence_client.py`
- `backend/src/api/resources.py`
- `frontend/src/components/LinkResourceModal.tsx`
- `frontend/src/components/ResourceCard.tsx`
- `frontend/src/hooks/useResources.ts`

**Files to modify:**
- `backend/src/api/router.py` — add resources router
- `frontend/src/components/ContextPanel.tsx` — Resources tab
- `frontend/src/components/IntentBar.tsx` — # mention autocomplete
- `frontend/src/types/index.ts` — Resource type

## Effort: L (5-6 days)

## Dependencies: STORY-UX-001 (Visual Identity)
