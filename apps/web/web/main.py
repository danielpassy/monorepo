from fastapi import FastAPI

app = FastAPI(title="web-app")


def run() -> None:
    print(f"You are running the {app.title}")
