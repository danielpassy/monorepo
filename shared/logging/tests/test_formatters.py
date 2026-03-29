from logging import format_log_line


def test_format_log_line() -> None:
    message = format_log_line("web", "service_started", port=8000)

    assert message == "component='web' event='service_started' port=8000"
