from __future__ import annotations

RUN_ALL_PATHS = [
    "docker-compose.yml",
    ".python-version",
    "pyproject.toml",
]

INFRA_PATHS = [
    "docker-compose.yml",
    "local/**",
]

CI_CONFIG_PATHS = [
    ".github/workflows/**",
    ".github/actions/**",
    ".github/scripts/**",
]

APPS = {
    "web": {
        "paths": ["apps/web/**"],
    },
    "worker": {
        "paths": ["apps/worker/**"],
    },
}
