from celery import Celery

from worker._shared.logging import format_log_line
from worker.settings import get_settings

settings = get_settings()
app = Celery(settings.app_name, broker=settings.celery_broker_url)
STARTUP_LOG = format_log_line("worker", "service_started", service=app.main)


def run() -> None:
    print(STARTUP_LOG)
    app.worker_main(["worker", "--loglevel=info"])
