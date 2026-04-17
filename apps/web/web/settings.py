from functools import lru_cache
from pathlib import Path
from typing import Any
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class WebSettings(BaseSettings):
    app_name: str = "web-app"
    default_patient_id: str = "patient-dev-1"
    session_cookie_name: str = "sid"
    secret_key: str
    cookie_secure: bool = False
    database_url: str = "postgresql+asyncpg://monorepo:monorepo@localhost:5432/monorepo"
    redis_url: str = "redis://localhost:6379/0"
    google_client_id: str = (
        "716393476167-40sbgf20kq14q15f9vllcue27sk5g6ne.apps.googleusercontent.com"
    )
    google_client_secret: str = ""
    debug: bool = False
    cors_allow_origins: Annotated[tuple[str, ...], NoDecode] = Field(
        default=("https://api.rafaellapontes.com.br",)
    )
    cors_allow_origin_regex: str = r"chrome-extension://.*"
    cors_allow_methods: Annotated[tuple[str, ...], NoDecode] = Field(
        default=("GET", "POST", "OPTIONS")
    )
    cors_allow_headers: Annotated[tuple[str, ...], NoDecode] = Field(
        default=("Authorization", "Content-Type")
    )
    cors_allow_credentials: bool = False
    sentry_dsn: str = "https://5769e9dcbef88ed9642b485ee53ec038@o4510981978128384.ingest.us.sentry.io/4511231779667968"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator(
        "cors_allow_origins", "cors_allow_methods", "cors_allow_headers", mode="before"
    )
    @classmethod
    def split_csv(cls, value: Any) -> Any:
        if isinstance(value, str):
            return tuple(item.strip() for item in value.split(",") if item.strip())
        return value


@lru_cache
def get_settings() -> WebSettings:
    return WebSettings()
