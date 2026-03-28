import jwt


def issue_token(subject: str, secret: str) -> str:
    return jwt.encode({"sub": subject}, secret, algorithm="HS256")


def decode_subject(token: str, secret: str) -> str:
    payload = jwt.decode(token, secret, algorithms=["HS256"])
    return str(payload["sub"])
