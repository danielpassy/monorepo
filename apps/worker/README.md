# Async Worker

This is an example async worker for the monorepo tutorial.
It is the service used to validate app-scoped CI selection.

## Setup

Copy the example environment file:

```bash
cp .env.example .env
```

## Docker

Must be built from the monorepo root (requires shared dependencies):

```bash
docker build -f apps/worker/Dockerfile .
```
