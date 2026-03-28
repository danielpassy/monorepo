from company_shared.auth import decode_subject, issue_token


def test_issue_and_decode_token() -> None:
    token = issue_token("alice", "secret-secret-secret-secret-1234")

    assert decode_subject(token, "secret-secret-secret-secret-1234") == "alice"
