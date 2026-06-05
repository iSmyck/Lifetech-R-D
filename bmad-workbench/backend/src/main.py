from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from src.core.config import settings
from src.core.database import engine, Base
from src.core.exceptions import ApiError
from src.api.router import api_router
from src.bmad.registry import get_registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        # Create tables if they don't exist (dev only; use Alembic in production)
        await conn.run_sync(Base.metadata.create_all)
    # Load BMAD registry
    registry = get_registry()
    registry.load()
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


# Prometheus metrics
Instrumentator().instrument(app).expose(app)

# API routes
app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "BMAD Stream Workbench API", "version": "0.1.0"}
