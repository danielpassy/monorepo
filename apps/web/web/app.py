from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from web._shared.logging import format_log_line
from web.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_allow_origins),
        allow_origin_regex=settings.cors_allow_origin_regex,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=list(settings.cors_allow_methods),
        allow_headers=list(settings.cors_allow_headers),
    )
    return app


STARTUP_LOG = format_log_line("web", "service_started", service="web-app")
