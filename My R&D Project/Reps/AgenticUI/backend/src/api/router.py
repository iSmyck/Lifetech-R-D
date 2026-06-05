"""FastAPI route aggregation."""

from fastapi import APIRouter

from backend.src.api.v1.endpoints.query import router as query_router
from backend.src.api.v1.endpoints.review import router as review_router
from backend.src.api.v1.endpoints.sessions import router as sessions_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(query_router)
api_router.include_router(review_router)
api_router.include_router(sessions_router)
