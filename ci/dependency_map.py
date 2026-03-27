from __future__ import annotations

RUN_ALL_PATHS = [
    "docker-compose.yml",
    ".python-version",
    "pyproject.toml",
]

INFRA_PATHS = [
    "docker-compose.yml",
    "dev/**",
]

CI_CONFIG_PATHS = [
    ".github/workflows/**",
    ".github/actions/**",
    "ci/**",
    "scripts/selective_ci.py",
]

APPS = {
    "web": {
        "paths": ["apps/web/**"],
    },
    "worker": {
        "paths": ["apps/worker/**"],
    },
}
