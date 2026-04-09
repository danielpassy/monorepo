from web._shared.logging import format_log_line
from web.app import create_app
from web.auth.controller import router as auth_router

app = create_app()
STARTUP_LOG = format_log_line("web", "service_started", service=app.title)

app.include_router(auth_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def run() -> None:
    print(STARTUP_LOG)
