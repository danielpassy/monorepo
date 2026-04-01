import os

from celery import Celery
from worker._shared.logging import format_log_line

broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
app = Celery("worker-app", broker=broker_url)
STARTUP_LOG = format_log_line("worker", "service_started", service=app.main)


def run() -> None:
    print(STARTUP_LOG)
    app.worker_main(["worker", "--loglevel=info"])
