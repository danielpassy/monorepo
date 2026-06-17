# Monorepo Agent Guide

This file is an index for agents. Keep detailed implementation, runtime, and onboarding instructions in app-level guides or docs.

## Project Map

| Path | Purpose |
|------|---------|
| `apps/web/` | FastAPI backend |
| `apps/frontend/` | React frontend using Vite+ |
| `apps/agent/` | Agent service workspace |
| `shared/` | Shared functionality, such as logging and protobuf contracts |
| `docs/` | Architecture, process, and implementation docs |
| `docs/projects/` | Per-feature project plans, contracts, reviews, and verification notes |
| `infra/k8s/` | Deployment manifests |
| `infra/terraform/` | Hetzner Cloud provisioning |
| `local/` | Local setup assets |

## Required Context

Before editing an area, read its local instructions first, then the relevant docs.

| Area | Required Context |
|------|------------------|
| `apps/web/` | `docs/backend-structure.md` |
| `apps/frontend/` | `apps/frontend/AGENTS.md`, `docs/frontend-structure.md` |
| `apps/agent/` | Local app instructions and agent docs, when present |
| `shared/` | The touched package's README/docs and all known consumers |
| `infra/` | `docs/infra-spec.md` |

Runtime commands belong in each app's local agent guide, not in this root index.

## Feature Work

For feature development, follow `docs/feature-development-cycle.md`.

Store all relevant project artifacts under `docs/projects/{project-name}/`.

Do not start implementation until `docs/projects/{project-name}/product-plan.md` has been accepted by a human, unless the user explicitly asks for a direct implementation.

## Cross-Area Changes

- For frontend/backend changes, keep API contracts and generated clients in sync.
- For shared package changes, check every consumer before changing public APIs.
- For infrastructure changes, review the plan before apply. Never commit Terraform state, tfvars, or generated plan files.
