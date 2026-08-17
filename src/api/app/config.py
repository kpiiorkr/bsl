import json
from functools import lru_cache
from urllib.parse import urlsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    neis_api_key: str = Field(min_length=1)
    neis_base_url: str = "https://open.neis.go.kr"
    allowed_origins: list[str]
    http_timeout_seconds: float = Field(default=10.0, gt=0, le=60)
    log_level: str = "INFO"

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                return json.loads(value)
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("allowed_origins")
    @classmethod
    def validate_origins(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("ALLOWED_ORIGINS must contain at least one origin")
        if "*" in value:
            raise ValueError("ALLOWED_ORIGINS must not contain a wildcard")
        for origin in value:
            parsed = urlsplit(origin)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.username
                or parsed.password
                or parsed.path not in {"", "/"}
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError(f"invalid origin: {origin}")
        return value

    @field_validator("neis_api_key")
    @classmethod
    def validate_key(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("NEIS_API_KEY must not be blank")
        return value

    @field_validator("neis_base_url")
    @classmethod
    def validate_base_url(cls, value: str) -> str:
        parsed = urlsplit(value)
        if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
            raise ValueError("NEIS_BASE_URL must be an HTTPS URL without credentials")
        return value.rstrip("/")

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, value: str) -> str:
        normalized = value.upper()
        if normalized not in {"CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"}:
            raise ValueError("LOG_LEVEL is invalid")
        return normalized


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
