from typing import List, Optional
from datetime import datetime, timezone, timedelta
from src.schemas.resource import ResourceSearchResult


# Mock Jira data for Phase 1
_MOCK_JIRA_TICKETS = [
    {
        "key": "PROD-442",
        "summary": "OAuth integration for mobile app",
        "status": "In Progress",
        "assignee": "Bob Martinez",
        "updated": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
    },
    {
        "key": "PROD-438",
        "summary": "Update auth flow documentation",
        "status": "Done",
        "assignee": "Alice Chen",
        "updated": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
    },
    {
        "key": "AUTH-42",
        "summary": "Implement JWT token refresh",
        "status": "In Progress",
        "assignee": "Sarah Chen",
        "updated": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
    },
    {
        "key": "INFRA-19",
        "summary": "K8s migration for staging environment",
        "status": "Done",
        "assignee": "Dave Kim",
        "updated": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
    },
    {
        "key": "PROD-501",
        "summary": "Design system component library",
        "status": "To Do",
        "assignee": "Carol White",
        "updated": (datetime.now(timezone.utc) - timedelta(days=0)).isoformat(),
    },
]


class JiraClient:
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or "https://jira.example.com"
        self.api_key = api_key

    async def search(self, query: str, limit: int = 10) -> List[ResourceSearchResult]:
        q = query.lower().strip()
        results = []
        for ticket in _MOCK_JIRA_TICKETS:
            if q in ticket["key"].lower() or q in ticket["summary"].lower():
                results.append(
                    ResourceSearchResult(
                        external_id=ticket["key"],
                        title=ticket["summary"],
                        status=ticket["status"],
                        assignee=ticket["assignee"],
                        last_updated=ticket["updated"],
                        url=f"{self.base_url}/browse/{ticket['key']}",
                    )
                )
        return results[:limit]

    async def get_ticket(self, key: str) -> Optional[ResourceSearchResult]:
        for ticket in _MOCK_JIRA_TICKETS:
            if ticket["key"].upper() == key.upper():
                return ResourceSearchResult(
                    external_id=ticket["key"],
                    title=ticket["summary"],
                    status=ticket["status"],
                    assignee=ticket["assignee"],
                    last_updated=ticket["updated"],
                    url=f"{self.base_url}/browse/{ticket['key']}",
                )
        return None
