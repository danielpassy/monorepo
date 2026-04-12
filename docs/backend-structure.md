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
- **controller**: imports input types from service, owns the response model, delegates to service, catches domain exceptions, returns HTTP response — no business logic, no duplicate input type definitions
- **model**: declarative SQLAlchemy schema only — columns, relationships, constraints, indexes, server defaults. No business logic, no query/CRUD helpers (those live in service), no serialization (response models live in the controller)
- **service**: business logic, raises domain exceptions, no HTTP knowledge; owns the input types (`CreateXInput`, `UpdateXInput`) as Pydantic `BaseModel` — controller imports and reuses them directly as FastAPI body params
- **middleware**: auth
- **exception handlers** (`add_exception_handler`): ValidationError→400, catch-all→500

## DTO convention

Input types are defined once in the service layer and imported by the controller — no parallel dataclass/Pydantic pair unless the service genuinely needs a different shape than the HTTP input (e.g. computed fields, merged data from multiple sources).

### Create
`CreateXInput(BaseModel)` — all required fields, optional nullable fields default to `None`.

```python
# service.py
class CreateCustomerInput(BaseModel):
    name: str
    email: str | None = None
    start_date: date
```

Controller uses it directly as the request body param; service receives it as-is.

### Update (PATCH)
`UpdateXInput(BaseModel)` — all fields optional, defaulting to `None`. Use `model_fields_set` to distinguish "field not sent" from "field explicitly set to null". This is the only correct way to allow clearing nullable columns via PATCH.

```python
# service.py
class UpdateCustomerInput(BaseModel):
    name: str | None = None
    email: str | None = None  # None can mean "clear this field"

async def update_customer(db, customer_id, data: UpdateCustomerInput):
    customer = await get_customer(db, customer_id)
    for field in data.model_fields_set:   # only fields present in the payload
        setattr(customer, field, getattr(data, field))
```

### Path args and user identity
Pass outside the DTO as explicit keyword arguments — path parameters and the authenticated user are not part of the request body and should not be stuffed into the input model.

```python
# controller
await service.create_session(db, customer_id=customer_id, therapist_id=request.state.user["user_id"], data=body)
```

### Internal service-to-service calls
Skip re-validation with `model_construct()`. Pass `_fields_set` explicitly if the receiving service uses `model_fields_set` for partial-update logic.

```python
SomeInput.model_construct(name="x", _fields_set={"name"})
```

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
