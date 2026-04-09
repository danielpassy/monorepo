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
}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        method = request.method
        path = request.url.path
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
