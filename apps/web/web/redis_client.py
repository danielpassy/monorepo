from collections.abc import AsyncGenerator

import redis.asyncio as aioredis

from web.settings import get_settings

_client = None


def _get_client() -> aioredis.Redis:
    global _client
    if _client is None:
        settings = get_settings()
        _client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _client


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    yield _get_client()
