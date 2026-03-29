from worker._shared.logging import format_log_line


def test_worker_can_use_shared_logging() -> None:
    message = format_log_line("worker", "job_completed", retries=1)

    assert message == "component='worker' event='job_completed' retries=1"
