from __future__ import annotations

import pytest

from selective_ci import compute_selection

ALL_KEYS = ("infra", "web", "frontend")


def triggers(*apps: str) -> dict[str, bool]:
    return {key: key in apps for key in ALL_KEYS}


@pytest.mark.parametrize("changed_files,expected", [
    # App-specific changes
    (["apps/web/main.py"], triggers("web")),
    (["apps/frontend/src/App.tsx"], triggers("frontend")),

    # Shared backend changes trigger web, not frontend
    (["shared/logging/logger.py"], triggers("web")),
    (["pyproject.toml"], triggers("web")),
    (["docker/base.Dockerfile"], triggers("web")),

    # CI workflow changes trigger only the relevant app
    ([".github/workflows/web.yml"], triggers("web")),
    ([".github/workflows/frontend.yml"], triggers("frontend")),
    ([".github/workflows/infra.yml"], triggers("infra")),

    # Shared CI changes trigger web + frontend
    ([".github/actions/get-diff/action.yml"], triggers("web", "frontend")),
    ([".github/scripts/selective_ci.py"], triggers("web")),

    # Infra changes
    (["infra/terraform/main.tf"], triggers("infra")),
    (["infra/k8s/ingress.yml"], triggers("infra")),

    # Unrelated files trigger nothing
    (["README.md"], triggers()),
    (["docker-compose.yml"], triggers()),

    # Multiple changes
    (["apps/web/main.py", "apps/frontend/src/App.tsx"], triggers("web", "frontend")),
])
def test_compute_selection(changed_files, expected):
    result = compute_selection(changed_files)
    assert {k: result[k] for k in expected} == expected
