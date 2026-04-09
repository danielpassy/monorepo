import os
from pathlib import Path

from alembic import command
from alembic.config import Config
import fakeredis.aioredis
import pytest
import pytest_asyncio
from fastapi import APIRouter
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.setdefault("SECRET_KEY", "test-secret-key-change-in-tests")

from web.auth import service as auth_service
from web.db import get_session
from web.main import app
from web.redis_client import get_redis
import web.auth.model  # noqa: F401 — registers models with Base

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://monorepo:monorepo@postgres:5432/monorepo",
)
APP_ROOT = Path(__file__).resolve().parents[1]
ALEMBIC_INI = APP_ROOT / "web" / "migrations" / "alembic.ini"

test_router = APIRouter()


@test_router.get("/_test/protected")
async def protected() -> dict[str, str]:
    return {"detail": "ok"}


app.include_router(test_router)


def _make_engine():
    return create_async_engine(DATABASE_URL)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Apply Alembic migrations once before the session; roll back after."""

    def _alembic_config() -> Config:
        config = Config(str(ALEMBIC_INI))
        config.set_main_option("sqlalchemy.url", DATABASE_URL)
        return config

    def _setup() -> None:
        command.upgrade(_alembic_config(), "head")

    def _teardown() -> None:
        command.downgrade(_alembic_config(), "base")

    _setup()
    yield
    _teardown()


@pytest_asyncio.fixture
async def db_session(create_tables):
    """Provide a clean AsyncSession bound to a rollback-only test transaction.

    The fixture opens a real connection, starts a transaction, and overrides the
    FastAPI session dependency so app code uses that same session. The transaction
    is rolled back after the test, which keeps every test isolated without having
    to truncate tables manually.
    """
    engine = _make_engine()
    async with engine.connect() as conn:
        transaction = await conn.begin()
        factory = async_sessionmaker(
            bind=conn, expire_on_commit=False, class_=AsyncSession
        )

        async with factory() as session:

            async def _override():
                yield session

            app.dependency_overrides[get_session] = _override
            try:
                yield session
            finally:
                app.dependency_overrides.pop(get_session, None)
                await session.close()
                await transaction.rollback()
    await engine.dispose()


@pytest_asyncio.fixture
async def redis():
    import web.redis_client as redis_module

    fake = fakeredis.aioredis.FakeRedis(decode_responses=True)

    # Patch module-level singleton so AuthMiddleware (which bypasses the dep)
    # also uses the fake Redis instance.
    old_client = redis_module._client
    redis_module._client = fake

    async def _override():
        yield fake

    app.dependency_overrides[get_redis] = _override
    yield fake
    await fake.flushall()
    redis_module._client = old_client
    app.dependency_overrides.pop(get_redis, None)


@pytest_asyncio.fixture
async def client(db_session, redis):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


@pytest_asyncio.fixture
async def authed_client(db_session, redis):
    """AsyncClient pre-loaded with a valid session cookie."""
    from web.auth.model import User
    from web.settings import get_settings

    settings = get_settings()
    user = User(email="test@example.com", name="Test User", google_id="g-123")
    db_session.add(user)
    await db_session.commit()

    session_id = await auth_service.create_session(redis, user)
    signed = auth_service.sign_session_id(session_id, settings.secret_key)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        cookies={settings.session_cookie_name: signed},
    ) as c:
        yield c
