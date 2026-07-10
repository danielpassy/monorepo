from pathlib import Path
from typing import Callable

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

FRONTEND_PUBLIC_FILES = ("favicon.svg", "icons.svg", "mockServiceWorker.js")


def _file_response(path: Path) -> Callable[[], FileResponse]:
    def handler() -> FileResponse:
        return FileResponse(path)

    return handler


def add_frontend_routes(app: FastAPI, frontend_dist_dir: Path) -> bool:
    dist_dir = Path(frontend_dist_dir)
    index_path = dist_dir / "index.html"
    if not index_path.is_file():
        return False

    assets_dir = dist_dir / "assets"
    if assets_dir.is_dir():
        app.mount(
            "/assets",
            StaticFiles(directory=assets_dir),
            name="frontend-assets",
        )

    for filename in FRONTEND_PUBLIC_FILES:
        file_path = dist_dir / filename
        if file_path.is_file():
            app.add_api_route(
                f"/{filename}",
                _file_response(file_path),
                methods=["GET", "HEAD"],
                include_in_schema=False,
            )

    app.add_api_route(
        "/",
        _file_response(index_path),
        methods=["GET", "HEAD"],
        include_in_schema=False,
    )
    return True
