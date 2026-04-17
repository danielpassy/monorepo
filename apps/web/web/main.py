import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.middleware.sessions import SessionMiddleware

from web.auth.controller import router as auth_router
from web.auth.oauth import configure_google_oauth
from web.customers.controller import router as customers_router
from web.middleware.auth import AuthMiddleware
from web.settings import get_settings
from web.sessions.controller import router as sessions_router


def create_app() -> FastAPI:
    settings = get_settings()
    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment="development" if settings.debug else "production",
            traces_sample_rate=1.0,
        )
    configure_google_oauth()

    # Import models so SQLAlchemy sees all mapped classes before the first use.
    import web.auth.model  # noqa: F401
    import web.customers.model  # noqa: F401
    import web.sessions.model  # noqa: F401

    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.secret_key,
        https_only=settings.cookie_secure,
    )
    app.add_middleware(AuthMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_allow_origins),
        allow_origin_regex=settings.cors_allow_origin_regex,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=list(settings.cors_allow_methods),
        allow_headers=list(settings.cors_allow_headers),
    )

    @app.exception_handler(ValidationError)
    async def validation_error_handler(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": exc.errors()})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        import traceback

        traceback.print_exc()
        return JSONResponse(
            status_code=500, content={"detail": "internal server error"}
        )

    app.include_router(auth_router)
    app.include_router(customers_router)
    app.include_router(sessions_router)

    return app


app = create_app()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
