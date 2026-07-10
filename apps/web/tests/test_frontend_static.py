from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

import web.middleware.auth as auth_middleware
from web.frontend import add_frontend_routes
from web.middleware.auth import AuthMiddleware, is_public_request


def test_add_frontend_routes_serves_index_public_files_and_assets(tmp_path) -> None:
    dist_dir = tmp_path / "dist"
    assets_dir = dist_dir / "assets"
    assets_dir.mkdir(parents=True)
    (dist_dir / "index.html").write_text("<html>app</html>")
    (dist_dir / "favicon.svg").write_text("<svg />")
    (assets_dir / "app.js").write_text("console.log('app')")

    app = FastAPI()

    assert add_frontend_routes(app, dist_dir) is True

    client = TestClient(app)
    assert client.get("/").text == "<html>app</html>"
    assert client.head("/").status_code == 200
    assert client.get("/favicon.svg").text == "<svg />"
    assert client.head("/favicon.svg").status_code == 200
    assert client.get("/assets/app.js").text == "console.log('app')"
    assert client.head("/assets/app.js").status_code == 200


def test_add_frontend_routes_skips_missing_build(tmp_path) -> None:
    app = FastAPI()

    assert add_frontend_routes(app, tmp_path / "missing") is False


def test_frontend_assets_are_public_without_opening_api_routes() -> None:
    assert is_public_request("GET", "/")
    assert is_public_request("HEAD", "/")
    assert is_public_request("GET", "/assets")
    assert is_public_request("GET", "/assets/app.js")
    assert is_public_request("GET", "/favicon.svg")
    assert not is_public_request("GET", "/customers")
    assert not is_public_request("GET", "/sessions/session-id")
    assert not is_public_request("POST", "/assets/app.js")


def test_frontend_static_requests_skip_session_store(monkeypatch) -> None:
    app = FastAPI()
    app.add_middleware(AuthMiddleware)

    @app.get("/")
    def index() -> dict[str, str]:
        return {"status": "ok"}

    monkeypatch.setattr(
        auth_middleware,
        "get_settings",
        lambda: SimpleNamespace(session_cookie_name="sid", secret_key="secret"),
    )
    monkeypatch.setattr(
        auth_middleware.service,
        "unsign_session_id",
        lambda signed, secret_key: "session-id",
    )

    def fail_if_redis_is_requested():
        raise AssertionError("static requests must not access Redis")

    monkeypatch.setattr(auth_middleware, "_get_client", fail_if_redis_is_requested)

    response = TestClient(app).get("/", cookies={"sid": "signed-session"})

    assert response.status_code == 200
