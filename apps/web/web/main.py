from fastapi import FastAPI
from web._shared.auth import decode_subject, issue_token

app = FastAPI(title="web-app")
AUTH_SUBJECT = decode_subject(
    issue_token("web-app", "secret-secret-secret-secret-1234"),
    "secret-secret-secret-secret-1234",
)


def run() -> None:
    print(f"You are running the {app.title} as {AUTH_SUBJECT}")
