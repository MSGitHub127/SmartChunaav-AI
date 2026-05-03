"""
config.py – SmartChunaav AI
Centralised environment configuration using Pydantic-Settings.
All secrets and runtime settings are validated at startup so the app
fails fast with a clear error instead of crashing mid-request.

Usage:
    from config import settings
    print(settings.gcp_project)
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application-wide settings loaded from the environment (or a .env file).
    Pydantic validates every field at import time – a missing required secret
    raises a descriptive ValidationError before any request is served.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # silently ignore unknown env vars
    )

    # ── Google Cloud / Vertex AI ──────────────────────────────────────────
    gcp_project: str = Field(
        default="smartchunaav-ai-project", # Give it a default instead of ...
        alias="GCP_PROJECT"
    )
    google_api_key: str = Field(
        default="", 
        alias="GOOGLE_API_KEY",
        description="Gemini API Key from Google AI Studio."
    )
    gcp_location: str = Field(
        default="global",
        alias="GCP_LOCATION",
        description="Vertex AI location (e.g. 'global', 'us-central1').",
    )
    gemini_model: str = Field(
        default="gemini-2.0-flash",
        alias="GEMINI_MODEL",
        description="Gemini model identifier served via Vertex AI.",
    )

    # ── CORS ─────────────────────────────────────────────────────────────
    cors_origins: str = Field(
        default="http://localhost:3000",
        alias="CORS_ORIGINS",
        description="Comma-separated list of allowed frontend origins (e.g. 'http://localhost:3000' or '*').",
    )

    # ── App ───────────────────────────────────────────────────────────────
    app_env: Literal["development", "staging", "production"] = Field(
        default="development",
        alias="APP_ENV",
    )
    app_name: str = Field(default="SmartChunaav AI", alias="APP_NAME")


    @field_validator("gcp_project")
    @classmethod
    def _non_empty_project(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("GCP_PROJECT must not be empty.")
        return v.strip()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns a cached Settings singleton.
    Using lru_cache means the .env file is read only once per process,
    and tests can override this with `get_settings.cache_clear()`.
    """
    return Settings()


# Module-level convenience alias used throughout the codebase.
settings = get_settings()