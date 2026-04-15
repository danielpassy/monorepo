import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "web.app:create_app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        factory=True,
        log_level="debug",
    )
