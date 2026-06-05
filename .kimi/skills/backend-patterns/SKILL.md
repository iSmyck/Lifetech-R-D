---
name: backend-patterns
description: Use when designing REST API structure, repository/service layers, caching strategies, error handling, rate limiting, background jobs, or structured logging in the backend.
---

# Backend Development Patterns

Backend architecture patterns and best practices for scalable server-side applications.

## When to Activate

- Designing REST or GraphQL API endpoints
- Implementing repository, service, or controller layers
- Optimizing database queries (N+1, indexing, connection pooling)
- Adding caching (Redis, in-memory, HTTP cache headers)
- Setting up background jobs or async processing
- Structuring error handling and validation for APIs
- Building middleware (auth, logging, rate limiting)

## API Design Patterns

### RESTful API Structure

```
# PASS: Resource-based URLs
GET    /api/markets                 # List resources
GET    /api/markets/:id             # Get single resource
POST   /api/markets                 # Create resource
PUT    /api/markets/:id             # Replace resource
PATCH  /api/markets/:id             # Update resource
DELETE /api/markets/:id             # Delete resource

# PASS: Query parameters for filtering, sorting, pagination
GET /api/markets?status=active&sort=volume&limit=20&offset=0
```

### Repository Pattern

```python
# Abstract data access logic
from abc import ABC, abstractmethod
from typing import Optional, List

class MarketRepository(ABC):
    @abstractmethod
    async def find_all(self, filters: Optional[MarketFilters] = None) -> List[Market]: ...

    @abstractmethod
    async def find_by_id(self, id: str) -> Optional[Market]: ...

    @abstractmethod
    async def create(self, data: CreateMarketDto) -> Market: ...

    @abstractmethod
    async def update(self, id: str, data: UpdateMarketDto) -> Market: ...

    @abstractmethod
    async def delete(self, id: str) -> None: ...


class PostgresMarketRepository(MarketRepository):
    async def find_all(self, filters: Optional[MarketFilters] = None) -> List[Market]:
        query = select(Market)
        if filters and filters.status:
            query = query.where(Market.status == filters.status)
        if filters and filters.limit:
            query = query.limit(filters.limit)
        result = await self.session.execute(query)
        return result.scalars().all()
```

### Service Layer Pattern

```python
# Business logic separated from data access
class MarketService:
    def __init__(self, market_repo: MarketRepository) -> None:
        self.market_repo = market_repo

    async def search_markets(self, query: str, limit: int = 10) -> List[Market]:
        embedding = await generate_embedding(query)
        results = await self.vector_search(embedding, limit)
        market_ids = [r.id for r in results]
        markets = await self.market_repo.find_by_ids(market_ids)
        # Sort by similarity
        score_map = {r.id: r.score for r in results}
        markets.sort(key=lambda m: score_map.get(m.id, 0), reverse=True)
        return markets
```

### Middleware Pattern

```python
# Request/response processing pipeline
from starlette.middleware.base import BaseHTTPMiddleware

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        token = request.headers.get("authorization", "").replace("Bearer ", "")
        if not token:
            return JSONResponse({"error": "Unauthorized"}, status_code=401)
        try:
            request.state.user = await verify_token(token)
        except Exception:
            return JSONResponse({"error": "Invalid token"}, status_code=401)
        return await call_next(request)
```

## Database Patterns

### Query Optimization

```python
# PASS: GOOD: Select only needed columns
result = await session.execute(
    select(Market.id, Market.name, Market.status, Market.volume)
    .where(Market.status == "active")
    .order_by(Market.volume.desc())
    .limit(10)
)

# FAIL: BAD: Select everything
result = await session.execute(select(Market))
```

### N+1 Query Prevention

```python
# FAIL: BAD: N+1 query problem
markets = await get_markets()
for market in markets:
    market.creator = await get_user(market.creator_id)  # N queries

# PASS: GOOD: Batch fetch
markets = await get_markets()
creator_ids = [m.creator_id for m in markets]
creators = await get_users(creator_ids)  # 1 query
creator_map = {c.id: c for c in creators}
for market in markets:
    market.creator = creator_map.get(market.creator_id)
```

### Transaction Pattern

```python
async def create_market_with_position(
    market_data: CreateMarketDto,
    position_data: CreatePositionDto
) -> dict:
    async with session.begin():
        market = Market(**market_data.model_dump())
        session.add(market)
        await session.flush()
        position = Position(market_id=market.id, **position_data.model_dump())
        session.add(position)
    return {"success": True, "market_id": market.id}
```

## Caching Strategies

### Redis Caching Layer

```python
class CachedMarketRepository(MarketRepository):
    def __init__(self, base_repo: MarketRepository, redis: Redis) -> None:
        self.base_repo = base_repo
        self.redis = redis

    async def find_by_id(self, id: str) -> Optional[Market]:
        cached = await self.redis.get(f"market:{id}")
        if cached:
            return Market.model_validate_json(cached)
        market = await self.base_repo.find_by_id(id)
        if market:
            await self.redis.setex(f"market:{id}", 300, market.model_dump_json())
        return market

    async def invalidate_cache(self, id: str) -> None:
        await self.redis.delete(f"market:{id}")
```

### Cache-Aside Pattern

```python
async def get_market_with_cache(id: str) -> Market:
    cache_key = f"market:{id}"
    cached = await redis.get(cache_key)
    if cached:
        return Market.model_validate_json(cached)
    market = await db.get_market(id)
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    await redis.setex(cache_key, 300, market.model_dump_json())
    return market
```

## Error Handling Patterns

### Centralized Error Handler

```python
class ApiError(Exception):
    def __init__(self, status_code: int, message: str, is_operational: bool = True) -> None:
        self.status_code = status_code
        self.message = message
        self.is_operational = is_operational
        super().__init__(message)

async def error_handler(request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, ApiError):
        return JSONResponse(
            {"success": False, "error": exc.message},
            status_code=exc.status_code
        )
    if isinstance(exc, ValidationError):
        return JSONResponse(
            {"success": False, "error": "Validation failed", "details": exc.errors()},
            status_code=400
        )
    # Log unexpected errors
    logger.exception("Unexpected error")
    return JSONResponse(
        {"success": False, "error": "Internal server error"},
        status_code=500
    )
```

### Retry with Exponential Backoff

```python
import asyncio
from typing import Callable, TypeVar

T = TypeVar("T")

async def fetch_with_retry(fn: Callable[[], T], max_retries: int = 3) -> T:
    last_error: Exception
    for i in range(max_retries):
        try:
            return await fn()
        except Exception as error:
            last_error = error
            if i < max_retries - 1:
                delay = 2 ** i
                await asyncio.sleep(delay)
    raise last_error
```

## Authentication & Authorization

### JWT Token Validation

```python
from jose import jwt, JWTError

class JWTPayload(BaseModel):
    user_id: str
    email: str
    role: Literal["admin", "user"]

def verify_token(token: str) -> JWTPayload:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return JWTPayload(**payload)
    except JWTError:
        raise ApiError(401, "Invalid token")

async def require_auth(request: Request) -> JWTPayload:
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    if not token:
        raise ApiError(401, "Missing authorization token")
    return verify_token(token)
```

### Role-Based Access Control

```python
Permission = Literal["read", "write", "delete", "admin"]

role_permissions: dict[str, list[Permission]] = {
    "admin": ["read", "write", "delete", "admin"],
    "moderator": ["read", "write", "delete"],
    "user": ["read", "write"],
}

def has_permission(role: str, permission: Permission) -> bool:
    return permission in role_permissions.get(role, [])

def require_permission(permission: Permission):
    def decorator(endpoint: Callable):
        async def wrapper(request: Request, *args, **kwargs):
            user = await require_auth(request)
            if not has_permission(user.role, permission):
                raise ApiError(403, "Insufficient permissions")
            return await endpoint(request, *args, **kwargs)
        return wrapper
    return decorator
```

## Rate Limiting

Rate limiting must use a shared store such as Redis, a gateway, or the platform's native limiter. Do not use per-process in-memory counters for production APIs: they reset on deploy, split across replicas, and fail open in serverless or multi-instance environments.

Keep the backend layer responsible for choosing the integration point and error shape.

## Background Jobs & Queues

### Simple Queue Pattern

```python
import asyncio
from collections import deque
from typing import Generic, TypeVar

T = TypeVar("T")

class JobQueue(Generic[T]):
    def __init__(self) -> None:
        self._queue: deque[T] = deque()
        self._processing = False

    async def add(self, job: T) -> None:
        self._queue.append(job)
        if not self._processing:
            await self._process()

    async def _process(self) -> None:
        self._processing = True
        while self._queue:
            job = self._queue.popleft()
            try:
                await self._execute(job)
            except Exception:
                logger.exception("Job failed: %s", job)
        self._processing = False

    async def _execute(self, job: T) -> None:
        raise NotImplementedError
```

## Logging & Monitoring

### Structured Logging

```python
from typing import Any
import json

class Logger:
    def _log(self, level: str, message: str, context: dict[str, Any] | None = None) -> None:
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
            **(context or {}),
        }
        print(json.dumps(entry))

    def info(self, message: str, context: dict[str, Any] | None = None) -> None:
        self._log("info", message, context)

    def error(self, message: str, error: Exception, context: dict[str, Any] | None = None) -> None:
        self._log("error", message, {
            **(context or {}),
            "error": str(error),
            "error_type": type(error).__name__,
        })
```

**Remember**: Backend patterns enable scalable, maintainable server-side applications. Choose patterns that fit your complexity level.
