from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from web._shared.logging import format_log_line


def create_app() -> FastAPI:
    app = FastAPI(title="web-app")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app


STARTUP_LOG = format_log_line("web", "service_started", service="web-app")
