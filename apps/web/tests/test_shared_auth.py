from web._shared.auth import decode_subject, issue_token


def test_web_can_use_shared_auth() -> None:
    secret = "secret-secret-secret-secret-1234"
    token = issue_token("web-user", secret)

    assert decode_subject(token, secret) == "web-user"
