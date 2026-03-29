# syntax=docker/dockerfile:1

ARG BASE_IMAGE=monorepo-python-base:dev

FROM ${BASE_IMAGE}

COPY apps/worker/pyproject.toml apps/worker/uv.lock ./
RUN uv sync --frozen --no-install-project

COPY apps/worker/entrypoint.py ./entrypoint.py
COPY apps/worker/worker ./worker
COPY apps/worker/tests ./tests
COPY shared/logging /shared/logging
RUN uv sync --frozen

CMD ["uv", "run", "python", "entrypoint.py"]
