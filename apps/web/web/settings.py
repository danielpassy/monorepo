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
    session_cookie_name: str = "session"
    session_cookie_value: str = "dev-session"
    cors_allow_origins: Annotated[tuple[str, ...], NoDecode] = Field(
        default=("https://api.rafaellapontes.com.br",)
    )
    cors_allow_origin_regex: str = r"chrome-extension://.*"
    cors_allow_methods: Annotated[tuple[str, ...], NoDecode] = Field(default=("GET", "POST", "OPTIONS"))
    cors_allow_headers: Annotated[tuple[str, ...], NoDecode] = Field(
        default=("Authorization", "Content-Type")
    )
    cors_allow_credentials: bool = False

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("cors_allow_origins", "cors_allow_methods", "cors_allow_headers", mode="before")
    @classmethod
    def split_csv(cls, value: Any) -> Any:
        if isinstance(value, str):
            return tuple(item.strip() for item in value.split(",") if item.strip())
        return value


@lru_cache
def get_settings() -> WebSettings:
    return WebSettings()
