from typing import List, Optional
from datetime import datetime, timezone, timedelta
from src.schemas.resource import ResourceSearchResult


# Mock Confluence data for Phase 1
_MOCK_CONFLUENCE_PAGES = [
    {
        "id": "CONF-101",
        "title": "API Design Guidelines",
        "space": "Engineering",
        "last_editor": "Alice Chen",
        "updated": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat(),
    },
    {
        "id": "CONF-102",
        "title": "Onboarding Runbook",
        "space": "People",
        "last_editor": "Elena Rossi",
        "updated": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
    },
    {
        "id": "CONF-103",
        "title": "Q3 Roadmap",
        "space": "Product",
        "last_editor": "Sarah Chen",
        "updated": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
    },
    {
        "id": "CONF-104",
        "title": "Security Policy",
        "space": "Engineering",
        "last_editor": "Bob Martinez",
        "updated": (datetime.now(timezone.utc) - timedelta(days=14)).isoformat(),
    },
    {
        "id": "CONF-105",
        "title": "Frontend Architecture",
        "space": "Engineering",
        "last_editor": "Frank Liu",
        "updated": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
    },
]


class ConfluenceClient:
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or "https://confluence.example.com"
        self.api_key = api_key

    async def search(self, query: str, limit: int = 10) -> List[ResourceSearchResult]:
        q = query.lower().strip()
        results = []
        for page in _MOCK_CONFLUENCE_PAGES:
            if q in page["id"].lower() or q in page["title"].lower() or q in page["space"].lower():
                results.append(
                    ResourceSearchResult(
                        external_id=page["id"],
                        title=page["title"],
                        status="Published",
                        assignee=page["last_editor"],
                        last_updated=page["updated"],
                        url=f"{self.base_url}/pages/viewpage.action?pageId={page['id']}",
                        space_name=page["space"],
                    )
                )
        return results[:limit]

    async def get_page(self, page_id: str) -> Optional[ResourceSearchResult]:
        for page in _MOCK_CONFLUENCE_PAGES:
            if page["id"].upper() == page_id.upper():
                return ResourceSearchResult(
                    external_id=page["id"],
                    title=page["title"],
                    status="Published",
                    assignee=page["last_editor"],
                    last_updated=page["updated"],
                    url=f"{self.base_url}/pages/viewpage.action?pageId={page['id']}",
                    space_name=page["space"],
                )
        return None
