from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from src.core.database import get_db
from src.core.config import settings

router = APIRouter(prefix="/health", tags=["health"])

# Simple redis client for health checks
redis_client = Redis.from_url(str(settings.redis_url), decode_responses=True)


@router.get("", status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "ok"}


@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check(db: AsyncSession = Depends(get_db)):
    checks = {}
    status_code = status.HTTP_200_OK

    # DB check
    try:
        await db.execute("SELECT 1")
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    # Redis check
    try:
        await redis_client.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {"status": "ready" if status_code == 200 else "not_ready", "checks": checks}
