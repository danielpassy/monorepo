from fastapi import FastAPI

from web.main import app


def test_web_app_is_fastapi() -> None:
    assert isinstance(app, FastAPI)
