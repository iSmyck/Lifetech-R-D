"""FastAPI application factory for EGM AI Backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.src.api.router import api_router
from backend.src.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    yield
    # Shutdown


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="EGM AI Multi-Agent Backend",
        description="Cultural Marketing Intelligence Platform — Multi-Agent System",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS
    origins = [origin.strip() for origin in settings.backend_cors_origins.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routes
    app.include_router(api_router)

    # Health check
    @app.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "healthy", "service": "egm-ai-backend"}

    return app


app = create_app()
