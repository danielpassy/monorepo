from web._shared.logging import format_log_line
from web.app import create_app
from web.auth.controller import router as auth_router
from web.customers.controller import router as customers_router
from web.sessions.controller import router as sessions_router

# Ensure all models are registered with the mapper before any mapper is configured
import web.auth.model  # noqa: F401, E402
import web.customers.model  # noqa: F401, E402
import web.sessions.model  # noqa: F401, E402

app = create_app()
STARTUP_LOG = format_log_line("web", "service_started", service=app.title)

app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(sessions_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def run() -> None:
    print(STARTUP_LOG)
