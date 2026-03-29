from web._shared.logging import format_log_line


def test_web_can_use_shared_logging() -> None:
    message = format_log_line("web", "request_completed", status=200)

    assert message == "component='web' event='request_completed' status=200"
