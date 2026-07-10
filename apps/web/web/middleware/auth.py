from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from web.auth import service
from web.redis_client import _get_client
from web.settings import get_settings

PUBLIC_ROUTES = {
    ("GET", "/health"),
    ("GET", "/auth/google"),
    ("GET", "/auth/google/callback"),
    ("GET", "/auth/me"),
    ("POST", "/auth/logout"),
    ("POST", "/auth/dev-login"),
}

FRONTEND_PUBLIC_PATHS = {
    "/",
    "/assets",
    "/favicon.svg",
    "/icons.svg",
    "/mockServiceWorker.js",
}

FRONTEND_PUBLIC_PREFIXES = ("/assets/",)


def is_frontend_static_request(method: str, path: str) -> bool:
    if method in {"GET", "HEAD"}:
        if path in FRONTEND_PUBLIC_PATHS:
            return True
        return path.startswith(FRONTEND_PUBLIC_PREFIXES)
    return False


def is_public_request(method: str, path: str) -> bool:
    return (method, path) in PUBLIC_ROUTES or is_frontend_static_request(method, path)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        method = request.method
        path = request.url.path

        # Static files never need user context. Avoid a Redis lookup for every asset
        # when an authenticated browser sends its domain-scoped session cookie.
        if is_frontend_static_request(method, path):
            return await call_next(request)

        is_public = (method, path) in PUBLIC_ROUTES

        settings = get_settings()
        signed = request.cookies.get(settings.session_cookie_name)
        if signed:
            session_id = service.unsign_session_id(signed, settings.secret_key)
            if session_id:
                redis = _get_client()
                try:
                    user = await service.get_session_user(redis, session_id)
                    request.state.user = user
                except service.SessionNotFoundError:
                    pass

        if not is_public and not getattr(request.state, "user", None):
            return JSONResponse(
                status_code=401, content={"detail": "not authenticated"}
            )

        return await call_next(request)
