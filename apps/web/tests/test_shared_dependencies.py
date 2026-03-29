import re
import tomllib
from pathlib import Path


def _normalize_dependency_name(requirement: str) -> str:
    match = re.match(r"^[A-Za-z0-9_.-]+", requirement)
    assert match is not None, f"Unsupported dependency format: {requirement}"
    return match.group(0).lower().replace("_", "-").replace(".", "-")


def _shared_root_for(app_root: Path) -> Path:
    if Path("/shared").is_dir():
        return Path("/shared")
    if (app_root / "shared").is_dir():
        return app_root / "shared"
    return app_root.parents[1] / "shared"


def test_web_declares_dependencies_for_shared_packages() -> None:
    app_root = Path(__file__).resolve().parents[1]
    shared_dir = app_root / "web" / "_shared"
    shared_root = _shared_root_for(app_root)

    app_pyproject = tomllib.loads((app_root / "pyproject.toml").read_text())
    app_dependencies = {
        _normalize_dependency_name(requirement)
        for requirement in app_pyproject["project"]["dependencies"]
    }

    for shared_package in shared_dir.iterdir():
        if not shared_package.is_symlink() and not shared_package.is_dir():
            continue

        shared_pyproject = shared_root / shared_package.name / "pyproject.toml"
        if not shared_pyproject.is_file():
            continue

        shared_dependencies = tomllib.loads(shared_pyproject.read_text())["project"]["dependencies"]
        missing_dependencies = sorted(
            _normalize_dependency_name(requirement)
            for requirement in shared_dependencies
            if _normalize_dependency_name(requirement) not in app_dependencies
        )

        assert not missing_dependencies, (
            f"web uses shared/{shared_package.name} but is missing dependencies: "
            f"{', '.join(missing_dependencies)}"
        )
