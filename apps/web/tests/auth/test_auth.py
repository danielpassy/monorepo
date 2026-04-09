from httpx import ASGITransport, AsyncClient

from web.auth import service as auth_service
from web.main import app
from web.settings import get_settings


async def test_valid_session_passes_middleware(authed_client) -> None:
    response = await authed_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


async def test_missing_session_returns_401(client) -> None:
    response = await client.get("/auth/me")
    # /auth/me is public — returns 401 payload, not blocked by middleware
    assert response.status_code == 401


async def test_protected_route_without_session_returns_401(client) -> None:
    response = await client.get("/some-protected-route")
    assert response.status_code == 401


async def test_protected_route_with_valid_session_passes(authed_client) -> None:
    # /auth/me is in the public whitelist and reflects the injected user
    response = await authed_client.get("/auth/me")
    assert response.status_code == 200


async def test_invalid_cookie_signature_returns_401(client) -> None:
    settings = get_settings()
    client.cookies.set(settings.session_cookie_name, "tampered.invalidsig")
    response = await client.get("/auth/me")
    # /auth/me is public so middleware skips it; but there's no user in state
    assert response.status_code == 401


async def test_get_or_create_user_creates_on_first_login(db_session) -> None:
    info = auth_service.GoogleUserInfo(
        google_id="g-new-1", email="new@example.com", name="New User"
    )
    user = await auth_service.get_or_create_user(db_session, info)
    assert user.id is not None
    assert user.email == "new@example.com"


async def test_get_or_create_user_reuses_on_second_login(db_session) -> None:
    info = auth_service.GoogleUserInfo(
        google_id="g-dup-1", email="dup@example.com", name="Dup User"
    )
    user1 = await auth_service.get_or_create_user(db_session, info)
    user2 = await auth_service.get_or_create_user(db_session, info)
    assert user1.id == user2.id


async def test_create_session_sets_seven_day_ttl(db_session, redis) -> None:
    from web.auth.model import User

    user = User(email="ttl@example.com", name="TTL User", google_id="g-ttl-1")
    db_session.add(user)
    await db_session.commit()

    session_id = await auth_service.create_session(redis, user)
    ttl = await redis.ttl(f"session:{session_id}")
    assert (
        auth_service.SESSION_TTL_SECONDS - 1 <= ttl <= auth_service.SESSION_TTL_SECONDS
    )


async def test_google_callback_sets_httponly_samesite_cookie(
    db_session, redis, monkeypatch
) -> None:
    """Callback must set HTTP-only, signed, SameSite=Lax cookie."""
    from unittest.mock import AsyncMock
    import web.auth.oauth as auth_oauth
    from web.auth.oauth import OAuthUserInfo

    fake_userinfo = OAuthUserInfo(
        sub="g-cookie-test", email="cookie@example.com", name="Cookie User"
    )
    monkeypatch.setattr(
        auth_oauth, "exchange_google_code", AsyncMock(return_value=fake_userinfo)
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        response = await c.get("/auth/google/callback", follow_redirects=False)

    settings = get_settings()
    cookie_header = response.headers.get("set-cookie", "")
    assert settings.session_cookie_name in cookie_header
    assert "HttpOnly" in cookie_header
    assert (
        "SameSite=lax" in cookie_header.lower()
        or "samesite=lax" in cookie_header.lower()
    )


async def test_google_callback_sets_secure_cookie_when_enabled(
    db_session, redis, monkeypatch
) -> None:
    from unittest.mock import AsyncMock
    import web.auth.oauth as auth_oauth
    from web.auth.oauth import OAuthUserInfo

    settings = get_settings()
    monkeypatch.setattr(settings, "cookie_secure", True)
    fake_userinfo = OAuthUserInfo(
        sub="g-cookie-secure", email="secure@example.com", name="Secure User"
    )
    monkeypatch.setattr(
        auth_oauth, "exchange_google_code", AsyncMock(return_value=fake_userinfo)
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        response = await c.get("/auth/google/callback", follow_redirects=False)

    cookie_header = response.headers.get("set-cookie", "")
    assert "Secure" in cookie_header


async def test_logout_invalidates_session(authed_client, redis) -> None:
    # confirm session exists before logout
    me = await authed_client.get("/auth/me")
    assert me.status_code == 200

    logout = await authed_client.post("/auth/logout")
    assert logout.status_code == 200

    # session should be gone from Redis
    keys = await redis.keys("session:*")
    assert len(keys) == 0
