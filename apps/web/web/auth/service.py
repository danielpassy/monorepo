import json
import uuid
from dataclasses import dataclass

import redis.asyncio as aioredis
from itsdangerous import BadSignature, Signer
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from web.auth.model import User

SESSION_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days


@dataclass
class GoogleUserInfo:
    google_id: str
    email: str
    name: str


class SessionNotFoundError(Exception):
    pass


def sign_session_id(session_id: str, secret: str) -> str:
    return Signer(secret).sign(session_id).decode()


def unsign_session_id(signed_value: str, secret: str) -> str | None:
    try:
        return Signer(secret).unsign(signed_value).decode()
    except BadSignature:
        return None


async def create_google_user(session: AsyncSession, info: GoogleUserInfo) -> User:
    stmt = (
        insert(User)
        .values(email=info.email, name=info.name, google_id=info.google_id)
        .on_conflict_do_update(
            index_elements=[User.google_id],
            set_={"email": info.email, "name": info.name},
        )
        .returning(User)
    )
    result = await session.execute(stmt)
    user = result.scalar_one()
    await session.commit()
    return user


async def create_session(redis: aioredis.Redis, user: User) -> str:
    session_id = str(uuid.uuid4())
    payload = json.dumps({"user_id": user.id, "email": user.email, "name": user.name})
    await redis.setex(f"session:{session_id}", SESSION_TTL_SECONDS, payload)
    return session_id


async def get_session_user(redis: aioredis.Redis, session_id: str) -> dict:
    raw = await redis.get(f"session:{session_id}")
    if raw is None:
        raise SessionNotFoundError(session_id)
    return json.loads(raw)


async def delete_session(redis: aioredis.Redis, session_id: str) -> None:
    await redis.delete(f"session:{session_id}")
