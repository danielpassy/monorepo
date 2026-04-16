import pytest
from fastapi import APIRouter
from fastapi.testclient import TestClient
from pydantic import BaseModel

from web.middleware.auth import PUBLIC_ROUTES
from web.main import create_app

_test_router = APIRouter()


class _SomeModel(BaseModel):
    value: int


@_test_router.post("/_test/validation-error")
def trigger_validation_error():
    _SomeModel(value="not-an-int")  # type: ignore[arg-type]


@_test_router.get("/_test/unhandled-error")
def trigger_unhandled_error():
    raise RuntimeError("boom")


@pytest.fixture
def test_app():
    app = create_app()
    app.include_router(_test_router)
    original_public_routes = PUBLIC_ROUTES.copy()
    PUBLIC_ROUTES.update(
        {("POST", "/_test/validation-error"), ("GET", "/_test/unhandled-error")}
    )
    try:
        yield app
    finally:
        PUBLIC_ROUTES.clear()
        PUBLIC_ROUTES.update(original_public_routes)


def test_validation_error_returns_400(test_app) -> None:
    client = TestClient(test_app, raise_server_exceptions=False)
    response = client.post("/_test/validation-error")
    assert response.status_code == 400
    assert "detail" in response.json()


def test_unhandled_error_returns_500(test_app) -> None:
    client = TestClient(test_app, raise_server_exceptions=False)
    response = client.get("/_test/unhandled-error")
    assert response.status_code == 500
    assert response.json() == {"detail": "internal server error"}
