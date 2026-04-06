from worker.settings import get_settings


def test_worker_settings_read_env(monkeypatch) -> None:
    monkeypatch.setenv("APP_NAME", "worker-custom")
    monkeypatch.setenv("CELERY_BROKER_URL", "redis://redis.internal:6379/9")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.app_name == "worker-custom"
    assert settings.celery_broker_url == "redis://redis.internal:6379/9"

    get_settings.cache_clear()
