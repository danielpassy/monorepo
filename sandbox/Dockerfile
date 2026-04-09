# syntax=docker/dockerfile:1

FROM python:3.14.3-slim-trixie

ARG UV_VERSION=0.10.11
ARG NODE_MAJOR=22

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

# System deps + Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl ca-certificates git openssh-client jq bubblewrap gh \
    && curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Python tooling
RUN pip install --no-cache-dir --upgrade pip "uv==${UV_VERSION}"

# Codex (global npm)
RUN npm install -g @openai/codex

# Non-root user (CC refuses --dangerously-skip-permissions as root)
RUN useradd -m -s /bin/bash agent
USER agent
ENV PATH="/home/agent/.local/bin:${PATH}"

# Claude Code (native installer — must run as non-root)
RUN curl -fsSL https://claude.ai/install.sh | bash

WORKDIR /workspace

ENTRYPOINT ["sleep", "infinity"]
