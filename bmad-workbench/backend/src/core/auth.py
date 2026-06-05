from fastapi import Header, HTTPException, status
from typing import Optional


class MockUser:
    def __init__(self, user_id: str, display_name: str, email: str):
        self.id = user_id
        self.display_name = display_name
        self.email = email


async def get_current_user(x_user_id: Optional[str] = Header(None, alias="X-User-Id")) -> MockUser:
    """Mock authentication for Phase 1.

    In production this will validate JWT tokens and query LDAP.
    For now, accept X-User-Id header or default to a test user.
    """
    if x_user_id:
        return MockUser(
            user_id=x_user_id,
            display_name=f"User {x_user_id}",
            email=f"{x_user_id}@example.com",
        )
    # Default test user for development
    return MockUser(
        user_id="test-user-1",
        display_name="Test User",
        email="test@example.com",
    )


def require_auth(x_user_id: Optional[str] = Header(None, alias="X-User-Id")) -> MockUser:
    """Synchronous version for dependency injection."""
    if x_user_id:
        return MockUser(
            user_id=x_user_id,
            display_name=f"User {x_user_id}",
            email=f"{x_user_id}@example.com",
        )
    return MockUser(
        user_id="test-user-1",
        display_name="Test User",
        email="test@example.com",
    )
