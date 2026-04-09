import asyncio
import os

import fakeredis.aioredis
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from web.auth import service as auth_service
from web.db import get_session
from web.main import app
from web.models.base import Base
from web.redis_client import get_redis
import web.auth.model  # noqa: F401 — registers models with Base

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://monorepo:monorepo@postgres:5432/monorepo",
)


def _make_engine():
    return create_async_engine(DATABASE_URL)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create tables once before the session; drop after. Uses asyncio.run() to
    avoid sharing an event loop across pytest-asyncio's per-test loops."""

    async def _setup():
        engine = _make_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    async def _teardown():
        engine = _make_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    asyncio.run(_setup())
    yield
    asyncio.run(_teardown())


@pytest_asyncio.fixture
async def db_session(create_tables):
    """Fresh AsyncSession per test backed by a transaction that rolls back."""
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
