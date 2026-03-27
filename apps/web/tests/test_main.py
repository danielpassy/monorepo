from web.main import app


def test_app_title() -> None:
    assert app.title == "web-app"
