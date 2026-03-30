from fastapi.testclient import TestClient

from web.main import app


def test_app_title() -> None:
    assert app.title == "web-app"


def test_health_endpoint() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
