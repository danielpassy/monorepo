from celery import Celery
from worker._shared.auth import decode_subject, issue_token

app = Celery("worker-app")
AUTH_SUBJECT = decode_subject(
    issue_token("worker-app", "secret-secret-secret-secret-1234"),
    "secret-secret-secret-secret-1234",
)


def run() -> None:
    print(f"You are running the {app.main} as {AUTH_SUBJECT}")
