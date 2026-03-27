from celery import Celery

from worker.main import app


def test_worker_app_is_celery() -> None:
    assert isinstance(app, Celery)
