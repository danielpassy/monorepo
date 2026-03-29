from __future__ import annotations

from typing import Any

from structlog.processors import KeyValueRenderer


_renderer = KeyValueRenderer(sort_keys=True)


def format_log_line(component: str, event: str, **fields: Any) -> str:
    return _renderer(None, event, {"component": component, "event": event, **fields})
