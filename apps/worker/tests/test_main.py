from worker.main import app


def test_app_name() -> None:
    assert app.main == "worker-app"
