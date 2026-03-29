# syntax=docker/dockerfile:1

ARG BASE_IMAGE=monorepo-python-base:dev

FROM ${BASE_IMAGE}

COPY apps/web/pyproject.toml apps/web/uv.lock ./
RUN uv sync --frozen --no-install-project

COPY apps/web/entrypoint.py ./entrypoint.py
COPY apps/web/web ./web
COPY apps/web/tests ./tests
COPY shared/logging /shared/logging
RUN uv sync --frozen

CMD ["uv", "run", "python", "entrypoint.py"]
