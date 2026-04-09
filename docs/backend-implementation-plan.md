# Implementation Plan

## 1. Database setup
- Stack: async SQLAlchemy + Alembic
- Add `sqlalchemy[asyncio]`, `asyncpg`, `alembic` to web dependencies
- Add `DATABASE_URL` to `WebSettings`
- `web/db.py`: `create_async_engine` + `AsyncSession` factory + `get_session` FastAPI dependency
- `DeclarativeBase` in `web/models/base.py` shared by all domain models
- Alembic configured to autogenerate migrations from models

- k8s: init container runs `alembic upgrade head` before app container starts; pod won't start if migrations fail

- `conftest.py`: pytest fixture that provides `AsyncSession` wrapped in a transaction, rolled back after each test
- Override `get_session` dependency in tests to use the rolled-back session

AC:
- `web` app connects to `monorepo` DB on startup; migrations run automatically on deploy via init container
- test: query engine works (insert + select roundtrip)
- test: DB is clean between tests (insert in test A not visible in test B)

---

## 2. Exception handlers
- Use `app.add_exception_handler()` (not middleware)
- `ValidationError` handler → 400 `{"detail": ...}`
- catch-all `Exception` handler → 500 `{"detail": "internal server error"}`
- Register both in `create_app()`

AC:
- POST with malformed body returns 400
- unhandled exception returns 500
- neither leaks stack trace
- test: each handler covered with a dedicated test endpoint that triggers the exception

---

## 3. Auth
- Stack: Google OAuth via Authlib, stateful session in Redis, HTTP-only cookie
- Add `authlib`, `redis[asyncio]` to web dependencies
- Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` to `WebSettings` (secrets)
- Session: on login generate UUID `session_id`, store `{session_id: user_data}` in Redis with 7-day TTL, set HTTP-only signed cookie
- Auth middleware: reads cookie, looks up Redis, injects user into request state; raises 401 if missing/invalid
- Public routes (whitelisted from middleware): `GET /health`, `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/me`, `POST /auth/logout`
- All other routes protected by default
- User model (first domain model): `id`, `email`, `name`, `google_id` — persisted on first login
- Cookie flags: HTTP-only, SameSite=Lax, Secure in production

### Endpoints
- `GET /auth/google` — redirect to Google consent screen
- `GET /auth/google/callback` — exchange code, create session, set cookie, redirect to `/dashboard`
- `GET /auth/me` → 200 user or 401
- `POST /auth/logout` → 200, invalidate cookie

### AC
- [ ] `GET /auth/me` returns user if session active, 401 if not
- [ ] Any non-whitelisted route returns 401 without valid session
- [ ] Session cookie is HTTP-only, signed, SameSite=Lax
- [ ] Secure flag enabled in production
- [ ] User created in DB on first Google login; subsequent logins reuse existing user
- [ ] Redis session expires after 7 days
- [ ] test: valid session → request passes through middleware
- [ ] test: missing/invalid session → 401
- [ ] test: `GET /auth/me` happy path
- [ ] test: user created on first login, not duplicated on second

---

## 4. Domain structure
- Each domain lives in `web/<domain>/` with `controller.py`, `service.py`, `model.py`
- Domain routers registered directly in `main.py` via `app.include_router()`
- No top-level `router.py` until complexity demands it

AC:
- [ ] Auth domain follows this structure
- [ ] Adding a new domain requires only creating `web/<domain>/` files and one `include_router` line in `main.py`

---

## 5. Worker — DATABASE_URL in k8s
- Add `DATABASE_URL` env var to `apps/worker/k8s/deployment.yml` (from secret)
- Mirror `WebSettings` pattern in `WorkerSettings` with `DATABASE_URL` field

AC: worker pod has DB access in production

---

## 6. CI test infrastructure
- CI: GitHub Actions with postgres service container
- `conftest.py`: `AsyncSession` fixture wrapped in transaction, rolled back after each test
- Override `get_session` dependency in tests to use rolled-back session
- `TestClient` fixture wrapping the FastAPI app
- Test `DATABASE_URL` set via GHA env vars, matching service container credentials

AC:
- [ ] `pytest` passes in CI against GHA postgres service container
- [ ] test: query engine works (insert + select roundtrip)
- [ ] test: DB is clean between tests (insert in test A not visible in test B)
