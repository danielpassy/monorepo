from celery import Celery
from worker._shared.logging import format_log_line

app = Celery("worker-app")
STARTUP_LOG = format_log_line("worker", "service_started", service=app.main)


def run() -> None:
    print(STARTUP_LOG)
