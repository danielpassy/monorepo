import os

import pytest
from fastapi.testclient import TestClient

from web.main import create_app
from web.settings import get_settings


@pytest.fixture(scope="module")
def cors_client() -> TestClient:
    original_origins = os.environ.get("CORS_ALLOW_ORIGINS")
    original_origin_regex = os.environ.get("CORS_ALLOW_ORIGIN_REGEX")

    os.environ["CORS_ALLOW_ORIGINS"] = "https://api.rafaellapontes.com.br"
    os.environ["CORS_ALLOW_ORIGIN_REGEX"] = r"chrome-extension://.*"
    get_settings.cache_clear()

    client = TestClient(create_app())
    yield client

    if original_origins is None:
        os.environ.pop("CORS_ALLOW_ORIGINS", None)
    else:
        os.environ["CORS_ALLOW_ORIGINS"] = original_origins

    if original_origin_regex is None:
        os.environ.pop("CORS_ALLOW_ORIGIN_REGEX", None)
    else:
        os.environ["CORS_ALLOW_ORIGIN_REGEX"] = original_origin_regex

    get_settings.cache_clear()


def test_cors_allows_chrome_extension_origin(cors_client) -> None:
    response = cors_client.options(
        "/health",
        headers={
            "Origin": "chrome-extension://abcdefghijklmnop",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert (
        response.headers["access-control-allow-origin"]
        == "chrome-extension://abcdefghijklmnop"
    )


def test_cors_rejects_unconfigured_origin(cors_client) -> None:
    response = cors_client.options(
        "/health",
        headers={
            "Origin": "https://evil.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
