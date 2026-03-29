from fastapi import FastAPI
from web._shared.logging import format_log_line

app = FastAPI(title="web-app")
STARTUP_LOG = format_log_line("web", "service_started", service=app.title)


def run() -> None:
    print(STARTUP_LOG)
