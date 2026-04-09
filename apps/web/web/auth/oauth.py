"""Typed wrapper around Authlib.

The Authlib package currently ships without usable type stubs, so the wrapper
casts the one untyped client boundary into a local protocol and keeps the rest
of the auth code typed.
"""

from dataclasses import dataclass
from typing import Any, Protocol, cast

from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse

from web.settings import get_settings

_oauth = OAuth()
_google_registered = False


@dataclass
class OAuthUserInfo:
    sub: str
    email: str
    name: str


class _GoogleOAuthClient(Protocol):
    async def authorize_redirect(
        self, request: Request, redirect_uri: str
    ) -> RedirectResponse: ...

    async def authorize_access_token(self, request: Request) -> dict[str, Any]: ...

    async def userinfo(self, *, token: dict[str, Any]) -> dict[str, Any]: ...


def _google_client() -> _GoogleOAuthClient:
    return cast(_GoogleOAuthClient, _oauth.google)


def configure_google_oauth() -> None:
    settings = get_settings()
    global _google_registered
    if _google_registered:
        return

    _oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
    _google_registered = True


async def get_google_redirect(request: Request) -> RedirectResponse:
    redirect_uri = str(request.url_for("google_callback"))
    return await _google_client().authorize_redirect(request, redirect_uri)


async def exchange_google_code(request: Request) -> OAuthUserInfo:
    token = await _google_client().authorize_access_token(request)
    raw_userinfo = token.get("userinfo")
    if raw_userinfo is None:
        raw_userinfo = await _google_client().userinfo(token=token)

    return OAuthUserInfo(
        sub=str(raw_userinfo["sub"]),
        email=str(raw_userinfo["email"]),
        name=str(raw_userinfo.get("name", raw_userinfo["email"])),
    )
