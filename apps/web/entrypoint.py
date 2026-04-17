import uvicorn

from web._shared.logging import format_log_line
from web.main import app

print(format_log_line("web", "service_started", service=app.title))
uvicorn.run(
    app,
    host="0.0.0.0",
    port=8000,
    proxy_headers=True,
    forwarded_allow_ips="*",
)
