# syntax=docker/dockerfile:1

ARG BASE_IMAGE=monorepo-python-base:dev

FROM ${BASE_IMAGE} AS test

COPY apps/web/pyproject.toml apps/web/uv.lock ./
RUN uv sync --frozen --no-install-project

COPY apps/web/entrypoint.py ./entrypoint.py
COPY apps/web/web ./web
COPY apps/web/tests ./tests
COPY shared/logging /shared/logging
RUN uv sync --frozen

CMD ["uv", "run", "task", "test"]


FROM ${BASE_IMAGE} AS runtime

COPY apps/web/pyproject.toml apps/web/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY apps/web/entrypoint.py ./entrypoint.py
COPY apps/web/web ./web
COPY shared/logging /shared/logging
RUN uv sync --frozen --no-dev

CMD ["uv", "run", "python", "entrypoint.py"]
