from __future__ import annotations

INFRA_PATHS = [
    "infra/**",
    ".github/workflows/infra.yml",
]

# Changes that affect all Python backend apps (web, worker)
BACKEND_SHARED_PATHS = [
    "pyproject.toml",
    ".python-version",
    "docker/base.Dockerfile",
    "shared/**",
]

APPS = {
    "web": {
        "paths": ["apps/web/**"] + BACKEND_SHARED_PATHS,
        "ci_paths": [
            ".github/workflows/web.yml",
            ".github/actions/**",
            ".github/scripts/**",
        ],
    },
    "worker": {
        "paths": ["apps/worker/**"] + BACKEND_SHARED_PATHS,
        "ci_paths": [
            ".github/workflows/worker.yml",
            ".github/actions/**",
            ".github/scripts/**",
        ],
    },
    "frontend": {
        "paths": ["apps/frontend/**"],
        "ci_paths": [
            ".github/workflows/frontend.yml",
            ".github/actions/**",
        ],
    },
}
