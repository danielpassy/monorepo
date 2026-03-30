import uvicorn

from web.main import STARTUP_LOG, app

print(STARTUP_LOG)
uvicorn.run(app, host="0.0.0.0", port=8000)
