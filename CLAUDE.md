# Monorepo

## Project structure

This is a Python + TypeScript monorepo with two main apps:

- `apps/web/` — Django backend
- `apps/frontend/` — React frontend (Vite+)

Before working on either app, read the relevant architecture doc:

- **Backend work:** read `docs/backend-structure.md`
- **Frontend work:** read `docs/frontend-structure.md`

## Sandbox

Agents run inside sandboxes — Docker containers with all tooling pre-installed and access to isolated postgres + redis. The sandbox mounts the repo and host credentials (Claude Code, Codex).

### Starting a sandbox

```sh
sandbox/run up           # default name derived from cwd
sandbox/run up my-task   # named sandbox
```

### Entering a sandbox

```sh
sandbox/run shell           # default sandbox
sandbox/run shell my-task   # named sandbox
```

### Other commands

```sh
sandbox/run ps              # list running sandboxes
sandbox/run logs my-task    # tail logs
sandbox/run stop my-task    # stop without removing
sandbox/run down my-task    # tear down + remove volumes
sandbox/run build           # rebuild the agent image
```

### Inside the sandbox

The repo is mounted at `/workspace`. Environment variables `DATABASE_URL`, `REDIS_URL`, and `CELERY_BROKER_URL` are pre-set pointing at the sandbox's own postgres and redis. Host credentials for Claude Code, Codex, and GitHub CLI are mounted from `~/.claude`, `~/.codex`, and `~/.config/gh`.

Run the backend directly (not as a container):
```sh
cd /workspace/apps/web && uv run manage.py runserver 0.0.0.0:8000
```

Run the frontend:
```sh
cd /workspace/apps/frontend && vp dev
```

Multiple sandboxes can run in parallel — each gets its own isolated infra via Docker Compose project names.
