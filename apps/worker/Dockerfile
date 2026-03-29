# syntax=docker/dockerfile:1

ARG BASE_IMAGE=monorepo-python-base:dev

FROM ${BASE_IMAGE} AS test

COPY apps/worker/pyproject.toml apps/worker/uv.lock ./
RUN uv sync --frozen --no-install-project

COPY apps/worker/entrypoint.py ./entrypoint.py
COPY apps/worker/worker ./worker
COPY apps/worker/tests ./tests
RUN uv sync --frozen

CMD ["uv", "run", "task", "test"]


FROM ${BASE_IMAGE} AS runtime

COPY apps/worker/pyproject.toml apps/worker/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY apps/worker/entrypoint.py ./entrypoint.py
COPY apps/worker/worker ./worker
RUN uv sync --frozen --no-dev

CMD ["uv", "run", "python", "entrypoint.py"]
