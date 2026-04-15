import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from web.auth import oauth as auth_oauth
from web.auth import service
from web.auth.service import GoogleUserInfo
from web.db import get_session
from web.redis_client import get_redis
from web.settings import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google")
async def google_login(request: Request) -> RedirectResponse:
    return await auth_oauth.get_google_redirect(request)


@router.get("/google/callback", name="google_callback")
async def google_callback(
    request: Request,
    db: AsyncSession = Depends(get_session),
    redis: aioredis.Redis = Depends(get_redis),
) -> RedirectResponse:
    settings = get_settings()
    userinfo = await auth_oauth.exchange_google_code(request)

    google_user = GoogleUserInfo(
        google_id=userinfo.sub,
        email=userinfo.email,
        name=userinfo.name,
    )
    user = await service.create_google_user(db, google_user)
    session_id = await service.create_session(redis, user)
    signed = service.sign_session_id(session_id, settings.secret_key)

    response = RedirectResponse(url="/dashboard")
    response.set_cookie(
        key=settings.session_cookie_name,
        value=signed,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        max_age=service.SESSION_TTL_SECONDS,
    )
    return response


class DevLoginBody(BaseModel):
    email: str


@router.post("/dev-login")
async def dev_login(
    body: DevLoginBody,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_session),
    redis: aioredis.Redis = Depends(get_redis),
) -> dict[str, str | int]:
    settings = get_settings()
    if not settings.debug:
        raise HTTPException(status_code=404, detail="not found")
    user = await service.get_or_create_email_user(db, str(body.email))
    session_id = await service.create_session(redis, user)
    signed = service.sign_session_id(session_id, settings.secret_key)

    response.set_cookie(
        key=settings.session_cookie_name,
        value=signed,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        max_age=service.SESSION_TTL_SECONDS,
    )
    return {"user_id": user.id, "email": user.email, "name": user.name}


@router.get("/me")
async def me(request: Request) -> dict[str, str | int]:
    user = getattr(request.state, "user", None)
    if user is None:
        raise HTTPException(status_code=401, detail="not authenticated")
    return user


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    redis: aioredis.Redis = Depends(get_redis),
) -> dict[str, str]:
    settings = get_settings()
    signed = request.cookies.get(settings.session_cookie_name)
    if signed:
        session_id = service.unsign_session_id(signed, settings.secret_key)
        if session_id:
            await service.delete_session(redis, session_id)

    response.delete_cookie(key=settings.session_cookie_name)
    return {"detail": "logged out"}
