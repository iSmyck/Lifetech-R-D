import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["REDIS_URL"] = "memory://"
os.environ["MINIO_ENDPOINT"] = "localhost:9000"
os.environ["MINIO_ACCESS_KEY"] = "minioadmin"
os.environ["MINIO_SECRET_KEY"] = "minioadmin"

# Mock MinIO BEFORE any app imports
import sys
from io import BytesIO

class FakeMinio:
    def bucket_exists(self, name):
        return True
    def make_bucket(self, name):
        pass
    def put_object(self, bucket, obj, data, length, content_type):
        pass
    def get_object(self, bucket, obj):
        class FakeResponse:
            def read(self):
                return b"fake content"
            def close(self):
                pass
            def release_conn(self):
                pass
        return FakeResponse()

class FakeMinioModule:
    @staticmethod
    def get_minio_client():
        return FakeMinio()
    @staticmethod
    def ensure_bucket(client, bucket_name):
        pass
    @staticmethod
    def upload_file(client, bucket_name, object_name, data, length, content_type):
        return f"{bucket_name}/{object_name}"
    @staticmethod
    def get_file(client, bucket_name, object_name):
        return BytesIO(b"fake content")

sys.modules["src.core.minio_client"] = FakeMinioModule()

# Mock Redis to avoid connection errors during import
from unittest.mock import AsyncMock, MagicMock

_fake_redis = MagicMock()
_fake_redis.ping = AsyncMock(return_value=True)

class FakeRedis:
    @staticmethod
    def from_url(*args, **kwargs):
        return _fake_redis

class FakeRedisAsyncioModule:
    Redis = FakeRedis

# Set up redis package hierarchy properly
import types
redis_pkg = types.ModuleType("redis")
redis_asyncio = types.ModuleType("redis.asyncio")
redis_asyncio.Redis = FakeRedis
redis_pkg.asyncio = redis_asyncio
sys.modules["redis"] = redis_pkg
sys.modules["redis.asyncio"] = redis_asyncio

# Mock Celery to avoid Redis connections
class FakeCelery:
    def __init__(self, *args, **kwargs):
        self.conf = {}
    def update(self, **kwargs):
        pass
    def task(self, *args, **kwargs):
        def decorator(func):
            func.delay = MagicMock(return_value=MagicMock(id="fake-task-id"))
            func.apply_async = MagicMock(return_value=MagicMock(id="fake-task-id"))
            return func
        return decorator

sys.modules["celery"] = MagicMock()
sys.modules["celery"].Celery = FakeCelery
sys.modules["celery"].shared_task = FakeCelery().task
sys.modules["celery.states"] = MagicMock()
sys.modules["celery.states"].SUCCESS = "SUCCESS"
sys.modules["celery.states"].FAILURE = "FAILURE"
sys.modules["kombu"] = MagicMock()

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from src import main as main_module
from src.core import database as db_module
from src.main import app
import src.models  # noqa: F401  – ensure models are registered on Base

# Create a fresh SQLite engine for tests (StaticPool so all connections share :memory:)
_test_engine = create_async_engine(
    os.environ["DATABASE_URL"],
    future=True,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
_test_session_factory = async_sessionmaker(_test_engine, class_=AsyncSession, expire_on_commit=False)

# Monkeypatch the database module's engine and session factory
db_module.engine = _test_engine
db_module.AsyncSessionLocal = _test_session_factory

# Monkeypatch main.py's engine reference
main_module.engine = _test_engine


async def override_get_db():
    async with _test_session_factory() as session:
        yield session


app.dependency_overrides[db_module.get_db] = override_get_db


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_database():
    async with _test_engine.begin() as conn:
        await conn.run_sync(db_module.Base.metadata.create_all)
    yield
    async with _test_engine.begin() as conn:
        await conn.run_sync(db_module.Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
