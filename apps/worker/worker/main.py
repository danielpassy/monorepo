from celery import Celery
app = Celery("worker-app")


def run() -> None:
    print(f"You are running the {app.main}")
