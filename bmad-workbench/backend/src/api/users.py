from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter(prefix="/users", tags=["users"])

# Mock user directory for Phase 1
MOCK_USERS = [
    {"id": "user-1", "display_name": "Sarah Chen", "email": "sarah.chen@example.com", "department": "Product"},
    {"id": "user-2", "display_name": "Alice Chen", "email": "alice.chen@example.com", "department": "Engineering"},
    {"id": "user-3", "display_name": "Bob Martinez", "email": "bob.martinez@example.com", "department": "Engineering"},
    {"id": "user-4", "display_name": "Carol White", "email": "carol.white@example.com", "department": "Design"},
    {"id": "user-5", "display_name": "Dave Kim", "email": "dave.kim@example.com", "department": "QA"},
    {"id": "user-6", "display_name": "Elena Rossi", "email": "elena.rossi@example.com", "department": "Product"},
    {"id": "user-7", "display_name": "Frank Liu", "email": "frank.liu@example.com", "department": "Engineering"},
]


@router.get("/search", response_model=list[dict])
async def search_users(
    q: Optional[str] = Query(None, min_length=1),
):
    """Search the user directory by name or email."""
    if not q:
        return MOCK_USERS[:10]
    q_lower = q.lower()
    results = [
        u for u in MOCK_USERS
        if q_lower in u["display_name"].lower() or q_lower in u["email"].lower()
    ]
    return results
