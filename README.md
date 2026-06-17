# Monorepo

This repository is a small study project for building and operating a Python monorepo.
It focuses on a few practical topics:

- monorepo layout and app-scoped CI
- FastAPI services
- OpenAPI-driven code generation and API contracts
- Kubernetes deployment on Hetzner
- shared infrastructure and secrets management
- agentic workflows and sandboxed experimentation

## What is in here

- `apps/web` - FastAPI web service
- `apps/frontend` - frontend application
- `apps/transcription-extension-chrome` - Chrome extension experiments
- `infra/k8s` - shared Kubernetes manifests
- `infra/terraform` - infrastructure provisioning pieces
- `sandbox` - isolated experiments and agentic workflow tooling
- `local` - local bootstrap helpers

## Kubernetes

The shared cluster resources live under `infra/k8s/` and are applied with:

```bash
kubectl apply -f infra/k8s/
```

The PostgreSQL deployment uses a persistent volume and is intentionally kept simple for this project.
Secrets such as database credentials are created manually in the cluster.

## Development

Each app has its own README with service-specific setup. The common pattern is:

```bash
cp .env.example .env
```

Then build or run the specific app from the monorepo root so shared dependencies are available.

## Sandbox

Agents and developers can run isolated experiments inside sandboxes. A sandbox is a Docker environment with the repo mounted and isolated PostgreSQL and Redis instances.

Start or enter the current worktree sandbox:

```bash
sandbox/run shell
```

Stop it without removing resources:

```bash
sandbox/run stop
```

Destroy it and remove volumes:

```bash
sandbox/run destroy
```

Inside the sandbox, the repo is mounted at `/workspace`. `DATABASE_URL`, `REDIS_URL`, and `CELERY_BROKER_URL` are pre-set for the sandbox's own services.

Run the backend directly from inside the sandbox:

```bash
cd /workspace/apps/web && uv run python dev.py
```

Run the frontend:

```bash
cd /workspace/apps/frontend && vp dev
```

Multiple sandboxes can run in parallel. Each one gets isolated infrastructure through Docker Compose project names.
