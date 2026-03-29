# syntax=docker/dockerfile:1

FROM python:3.14.3-slim-trixie

ARG UV_VERSION=0.10.11

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN python -m pip install --no-cache-dir --upgrade pip "uv==${UV_VERSION}"
