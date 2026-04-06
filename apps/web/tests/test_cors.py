from fastapi.testclient import TestClient

from web.main import app
from web.settings import get_settings


def build_client() -> TestClient:
    return TestClient(app)


def test_cors_allows_chrome_extension_origin(monkeypatch) -> None:
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "https://api.rafaellapontes.com.br")
    monkeypatch.setenv("CORS_ALLOW_ORIGIN_REGEX", r"chrome-extension://.*")
    get_settings.cache_clear()
    client = build_client()

    response = client.options(
        "/health",
        headers={
            "Origin": "chrome-extension://abcdefghijklmnop",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "chrome-extension://abcdefghijklmnop"

    get_settings.cache_clear()


def test_cors_rejects_unconfigured_origin(monkeypatch) -> None:
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "https://api.rafaellapontes.com.br")
    monkeypatch.setenv("CORS_ALLOW_ORIGIN_REGEX", r"chrome-extension://.*")
    get_settings.cache_clear()
    client = build_client()

    response = client.options(
        "/health",
        headers={
            "Origin": "https://evil.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers

    get_settings.cache_clear()
