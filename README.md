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
- `apps/worker` - async worker service
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
