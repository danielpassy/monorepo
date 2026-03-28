from worker._shared.auth import decode_subject, issue_token


def test_worker_can_use_shared_auth() -> None:
    secret = "secret-secret-secret-secret-1234"
    token = issue_token("worker-user", secret)

    assert decode_subject(token, secret) == "worker-user"
