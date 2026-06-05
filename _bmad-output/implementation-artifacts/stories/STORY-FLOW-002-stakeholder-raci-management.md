# STORY-FLOW-002: Stakeholder & RACI Management

## Status: ✅ Done

## User Problem
The Stakeholders tab shows 4 hardcoded mock people with no connection to reality. Analysts cannot:
- Add real colleagues from the company directory
- Assign RACI roles (Responsible, Accountable, Consulted, Informed)
- Request reviews from stakeholders
- See who has approved what

In a 200-person hierarchical org, this is a compliance and accountability nightmare.

## Design Principles
1. **Directory-first** — Stakeholders are real people from the company LDAP/directory
2. **One person, one RACI role** — Clear accountability, no confusion
3. **Review is a workflow** — Not just a list, but a process with states
4. **Visible to AI** — Stakeholder roles influence AI reasoning (e.g., "Accountable wants security section emphasized")

---

## User Flow: Adding a Stakeholder

### Entry Point
- Context Panel → Stakeholders tab → "Add Stakeholder" button

### Step 1 — Open Stakeholders Tab
- User clicks "Stakeholders" in Context Panel
- Sees current stakeholder list (or empty state)
- "Add Stakeholder" button at top right

### Step 2 — Open Stakeholder Picker
- User clicks "Add Stakeholder"
- **Stakeholder Picker Modal** opens

### Step 3 — Search Directory
- Search input focused with placeholder: "Search by name or email…"
- As user types (min 2 chars), backend searches user directory (`GET /api/users/search`)
- Results show as person cards:
  ```
  ┌────────────────────────────────────────┐
  │  SC  Sarah Chen                        │
  │     sarah.chen@company.com             │
│     Product Department                 │
│     3 active projects                  │
  └────────────────────────────────────────┘
  ```
- Each card shows: initials avatar, name, email, department, active project count
- Already-added stakeholders are dimmed with "Already added" badge

### Step 4 — Select Person
- User clicks a person card → card highlights
- "Next" button becomes active
- User clicks "Next"

### Step 5 — Assign RACI Role
- Screen transitions to RACI role selection:
  ```
  Assign role to Sarah Chen
  
  ○ Accountable (A) — "The one who ultimately approves"
    Only one person can be Accountable
  
  ● Responsible (R) — "The one who does the work"
    Currently: Bob Martinez
  
  ○ Consulted (C) — "Those whose opinions are sought"
    Currently: Carol White, Dave Kim
  
  ○ Informed (I) — "Those kept up-to-date"
    Currently: Elena Rossi
  ```
- Each role shows:
  - Radio button
  - Role name + letter
  - Description
  - Current occupants (if any)
- User selects "Consulted"
- "Add Stakeholder" button active

### Step 6 — Confirm & Add
- User clicks "Add Stakeholder"
- Modal closes
- New stakeholder appears in list with blue "New" badge (fades after 5s)
- Toast: "Sarah Chen added as Consulted"

### Step 7 — Stakeholder List
- List shows all stakeholders sorted by RACI priority (A → R → C → I)
- Each item:
  ```
  ┌─────────────────────────────────────────────────┐
  │  SC  Sarah Chen                    [Consulted]  │
  │     sarah.chen@company.com         [  ⋮  ] [✕] │
  └─────────────────────────────────────────────────┘
  ```
- Hover reveals: "Request Review" button, "Change Role" dropdown, "Remove" button

---

## User Flow: Requesting a Review

### Step 1 — Initiate Review Request
- User has a draft PRD ready for review
- Clicks "Request Review" on draft card action bar
- OR clicks "Request Review" next to stakeholder name

### Step 2 — Select Reviewers
- **Review Request Modal** opens
- Shows all stakeholders with checkboxes
- Pre-selects Accountable and Responsible by default
- User can add/remove reviewers
- Message textarea: "Please review the Q3 PRD draft. Focus on API contract section."

### Step 3 — Submit Request
- User clicks "Send Review Requests"
- Backend creates review records
- Reviewers receive:
  - In-app notification
  - Toast: "Review requested from Alice Chen, Bob Martinez"

### Step 4 — Reviewer Experience
- Reviewer opens thread
- Sees draft in read-only mode with review toolbar:
  - "Approve" button (green)
  - "Request Changes" button (amber)
  - "Add Comment" button
- Can highlight text and add inline comments
- Comments appear as threaded discussion on the draft

### Step 5 — Author Sees Review
- Author sees review status in Context Panel:
  ```
  Reviews
  ┌────────────────────────────────────────┐
  │ Alice Chen      [Requested Changes]    │
  │   "Need more detail on auth flow"       │
  │ Bob Martinez    [Approved ✓]           │
  └────────────────────────────────────────┘
  ```
- Inline comments visible on draft card
- "Resolve Comment" button for each

### Step 6 — Iterate
- Author makes changes
- Clicks "Request Re-review" → notifies reviewer
- Cycle continues until all approve

---

## User Flow: Changing a RACI Role

### Step 1 — Open Actions
- User hovers over stakeholder in list
- Clicks "Change Role" (dropdown appears)

### Step 2 — Select New Role
- Dropdown shows 4 options:
  - Accountable (warns if already assigned: "This will reassign from Alice Chen")
  - Responsible
  - Consulted
  - Informed
- User selects new role

### Step 3 — Confirm
- If reassigning Accountable: confirmation modal
- Otherwise: immediate update
- Stakeholder card animates to new position in list

---

## UI Specifications

### Stakeholder Picker Modal (Search)
```
┌────────────────────────────────────────────────────┐
│  Add Stakeholder                        [✕]        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Search directory                                  │
│  ┌────────────────────────────────────────────┐   │
│  │ 🔍 Sarah                                    │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  Results                                           │
│  ┌────────────────────────────────────────────┐   │
│  │  SC  Sarah Chen                             │   │
│  │      sarah.chen@company.com                 │   │
│  │      Product Department                     │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │  SC  Samuel Carter       [Already added]    │   │
│  │      samuel.carter@company.com              │   │
│  │      Engineering                            │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  [        Next        ]                            │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Stakeholder Picker Modal (RACI Selection)
```
┌────────────────────────────────────────────────────┐
│  Add Stakeholder                        [✕]        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Assign role to Sarah Chen                         │
│                                                    │
│  ○ Accountable (A)                                 │
│    The one who ultimately approves                 │
│    Currently: Alice Chen                           │
│                                                    │
│  ● Responsible (R)  ← selected                     │
│    The one who does the work                       │
│    Currently: Bob Martinez                         │
│                                                    │
│  ○ Consulted (C)                                   │
│    Those whose opinions are sought                 │
│    Currently: Carol White, Dave Kim                │
│                                                    │
│  ○ Informed (I)                                    │
│    Those kept up-to-date                           │
│    Currently: Elena Rossi                          │
│                                                    │
│  [     Add Stakeholder     ]                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Stakeholders Tab (Populated)
```
┌─────────────────────────────────────────────────────┐
│ Stakeholders                         [+ Add]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Accountable (A)                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │  AC  Alice Chen                    [Accountable]│ │
│ │      alice.chen@company.com        [Req Review] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Responsible (R)                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │  BM  Bob Martinez                  [Responsible]│ │
│ │      bob.martinez@company.com      [Req Review] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Consulted (C)                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │  CW  Carol White                    [Consulted] │ │
│ │      carol.white@company.com       [Change ✕]   │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │  DK  Dave Kim                       [Consulted] │ │
│ │      dave.kim@company.com          [Change ✕]   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Informed (I)                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │  ER  Elena Rossi                     [Informed] │ │
│ │      elena.rossi@company.com       [Change ✕]   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Review Request Modal
```
┌────────────────────────────────────────────────────┐
│  Request Review                         [✕]        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Select reviewers                                  │
│  ┌────────────────────────────────────────────┐   │
│  │ ☑ Alice Chen (Accountable)                  │   │
│  │ ☑ Bob Martinez (Responsible)                │   │
│  │ ☐ Carol White (Consulted)                   │   │
│  │ ☐ Dave Kim (Consulted)                      │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  Message (optional)                                │
│  ┌────────────────────────────────────────────┐   │
│  │ Please review the Q3 PRD draft. Focus on   │   │
│  │ the API contract section.                  │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  [    Send Review Requests    ]                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Backend
- [ ] `Stakeholder` model: id, thread_id, user_id, role (A/R/C/I), added_by, added_at
- [ ] `Review` model: id, thread_id, document_id, reviewer_id, status (pending/approved/changes_requested), comment, created_at, updated_at
- [ ] `GET /api/threads/{id}/stakeholders` — list stakeholders with user details
- [ ] `POST /api/threads/{id}/stakeholders` — add stakeholder (validates single Accountable)
- [ ] `PATCH /api/threads/{id}/stakeholders/{user_id}` — change RACI role
- [ ] `DELETE /api/threads/{id}/stakeholders/{user_id}` — remove stakeholder
- [ ] `POST /api/documents/{id}/reviews` — request review from selected stakeholders
- [ ] `GET /api/documents/{id}/reviews` — list review statuses
- [ ] `POST /api/reviews/{id}/respond` — approve or request changes
- [ ] `GET /api/users/search` — search company directory (already exists, enhance with department/avatar)

### Frontend
- [ ] `StakeholderPicker` modal with search + RACI selection (2-step wizard)
- [ ] `StakeholderList` component with sections per RACI role
- [ ] `ReviewRequestModal` for selecting reviewers + message
- [ ] `ReviewStatus` component showing approval states
- [ ] Inline comment system on draft cards (highlight text → comment)
- [ ] Context Panel Stakeholders tab uses real data
- [ ] Toast notifications for all stakeholder actions

### AI Integration
- [ ] Stakeholder roles injected into prompt context
- [ ] AI addresses Accountable person by name in checkpoints
- [ ] AI flags when Accountable has not yet approved

## Technical Notes

**Files to create:**
- `backend/src/models/stakeholder.py`
- `backend/src/models/review.py`
- `backend/src/schemas/stakeholder.py`
- `backend/src/schemas/review.py`
- `backend/src/services/stakeholder_service.py`
- `backend/src/api/stakeholders.py`
- `backend/src/api/reviews.py`
- `frontend/src/components/StakeholderPicker.tsx`
- `frontend/src/components/StakeholderList.tsx`
- `frontend/src/components/ReviewRequestModal.tsx`
- `frontend/src/components/ReviewStatus.tsx`
- `frontend/src/components/InlineComment.tsx`
- `frontend/src/hooks/useStakeholders.ts`
- `frontend/src/hooks/useReviews.ts`

**Files to modify:**
- `backend/src/api/router.py` — add stakeholder and review routers
- `backend/src/api/users.py` — enhance search with department, avatar
- `frontend/src/components/ContextPanel.tsx` — Stakeholders tab
- `frontend/src/components/StreamCard.tsx` — review actions on draft
- `frontend/src/types/index.ts` — Stakeholder, Review types

## Effort: L (5-6 days)

## Dependencies: STORY-UX-001 (Visual Identity), STORY-UX-006 (Project Stakeholder Management foundation)
