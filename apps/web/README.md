# Web App

This is an example web app for the monorepo tutorial.
It is the service used to validate app-scoped CI selection.

## Setup

Copy the example environment file:

```bash
cp .env.example .env
```

## Docker

Must be built from the monorepo root. The web image is based on
`monorepo-python-base:dev`, so build the shared base image first and wait for
that build to finish before building the web image:

```bash
docker compose build base
docker build -f apps/web/Dockerfile .
```
