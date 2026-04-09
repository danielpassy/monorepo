# Backend Structure

## Stack
- FastAPI + Uvicorn (ASGI)
- SQLAlchemy async + Alembic (ORM + migrations)
- Pydantic v2 + pydantic-settings (validation, config)
- Structlog (structured logging, via shared `_shared/logging`)
- pytest + httpx TestClient (tests)
- Python 3.14+

## App bootstrap
- Factory pattern: `web/app.py::create_app()` returns FastAPI instance
- Entry point: `entrypoint.py` runs uvicorn on 0.0.0.0:8000
- Settings: `WebSettings(BaseSettings)` loaded from `.env`, accessed via LRU-cached `get_settings()`
- Monorepo: shared packages symlinked under `web/_shared/`
- Migrations: Alembic lives in `web/migrations/` with `web/migrations/alembic.ini` as the entrypoint

## Conventions
- CSV env vars for list fields (CORS origins, methods, headers) via Pydantic field validator
- `test-project` task runs only project-level tests; `test` runs all
- A shared dependency validation test (`test_shared_dependencies.py`) ensures all consumed shared packages are declared as deps

## Infrastructure

### docker-compose (local dev)
- `postgres:17` — single shared DB: `monorepo`
- `redis:7-alpine` — Celery broker for worker app
- `web` — FastAPI app, port 8001→8000, `DATABASE_URL`→`monorepo`
- `worker` — Celery worker, `DATABASE_URL`→`monorepo`, `CELERY_BROKER_URL`→redis
- `base` — shared base Docker image (`monorepo-python-base:dev`) used by web and worker builds

### Kubernetes (production — k3s on Hetzner)
- Namespace: `monorepo`
- Ingress: Traefik with Let's Encrypt via Cloudflare DNS challenge
  - `api.rafaellapontes.com.br` → `web` service (port 80), rate-limited (30 req/min, burst 10)
  - `app.rafaellapontes.com.br` → frontend served from Hetzner Object Storage (ExternalName service)
- Web init container runs `alembic -c web/migrations/alembic.ini upgrade head` before the app container starts
- Redis deployed as `redis-broker` Deployment+Service, password from k8s Secret
- Traefik configured via `HelmChartConfig` in `kube-system`

### Secrets
- Stored encrypted in `infra/secrets.txt.enc`
- Contains production credentials (DB passwords, Redis password, Cloudflare API token, etc.)
- Decrypt locally to apply — never commit plaintext

## Philosophy
- Fail fast: Pydantic validates input shape at entry point; downstream code assumes valid data
- Avoid try/except except in controllers for known domain errors
- No defensive shape-checking ifs in service layer

## Error handling
- Pydantic ValidationError → middleware → 400
- Known domain exceptions (e.g. UserNotFoundError) → controller catches → 4xx
- Everything else → global error handler middleware → 500

## Layers
- **router**: registers routes, groups by domain
- **controller**: Pydantic input declaration, delegates to service, catches domain exceptions, returns HTTP response
- **model**: DB table definitions, no business logic
- **service**: business logic, raises domain exceptions, no HTTP knowledge; simple args as params, complex args as @dataclass
- **middleware**: auth
- **exception handlers** (`add_exception_handler`): ValidationError→400, catch-all→500

## Request flow
Request → auth middleware → router → controller (Pydantic validates)
  → invalid: middleware → 400
  → valid: service → domain exception: controller → 4xx
  → success: controller → response
  → unexpected error anywhere: global handler → 500

## Tests
- Each endpoint: one happy path test via TestClient
- Each service function: happy path + corner cases if needed
- All tests isolated, run against real DB container, no DB mocks
