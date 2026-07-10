# Web App

This is an example web app for the monorepo tutorial.
It is the service used to validate app-scoped CI selection.

## Setup

Copy the example environment file:

```bash
cp .env.example .env
```

## Docker

The image includes the compiled frontend. Build those assets first, then build
the shared Python base and web images from the monorepo root:

```bash
cd apps/frontend
vp install
vp run build
cd ../..
docker compose build base
docker build -f apps/web/Dockerfile .
```
