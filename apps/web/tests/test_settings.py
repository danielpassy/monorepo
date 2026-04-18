from web.settings import get_settings


def test_settings_parse_csv_and_bool(monkeypatch) -> None:
    monkeypatch.setenv("FRONTEND_URL", "https://app.example.com")
    monkeypatch.setenv(
        "CORS_ALLOW_ORIGINS", "https://api.example.com, https://app.example.com"
    )
    monkeypatch.setenv("CORS_ALLOW_METHODS", "GET,POST,OPTIONS")
    monkeypatch.setenv("CORS_ALLOW_HEADERS", "Authorization, Content-Type")
    monkeypatch.setenv("CORS_ALLOW_CREDENTIALS", "true")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.cors_allow_origins == (
        "https://api.example.com",
        "https://app.example.com",
    )
    assert settings.cors_allow_methods == ("GET", "POST", "OPTIONS")
    assert settings.cors_allow_headers == ("Authorization", "Content-Type")
    assert settings.cors_allow_credentials is True

    get_settings.cache_clear()


def test_cors_defaults_to_frontend_url(monkeypatch) -> None:
    monkeypatch.setenv("FRONTEND_URL", "https://app.example.com/")
    monkeypatch.delenv("CORS_ALLOW_ORIGINS", raising=False)
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.frontend_url == "https://app.example.com"
    assert settings.cors_allow_origins == ("https://app.example.com",)
    assert settings.cors_allow_credentials is True

    get_settings.cache_clear()
