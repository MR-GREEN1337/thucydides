from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pydantic import Field, field_validator
from typing import List, Optional


class Settings(BaseSettings):
    """
    Manages application configuration using Pydantic.
    Reads settings from environment variables.
    """

    # Application settings
    ENV: str = "development"
    FAIL_FAST: bool = False
    DEBUG: bool = False

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database settings
    POSTGRES_DATABASE_URL: str
    POSTGRES_SCHEMA: str = "public"
    POSTGRES_USE_SSL: bool = True

    # Connection Pool settings
    POSTGRES_POOL_SIZE: int = 10
    POSTGRES_MAX_OVERFLOW: int = 5
    POSTGRES_POOL_TIMEOUT: int = 30
    POSTGRES_POOL_RECYCLE: int = 1800  # 30 minutes

    # Connection Retry settings
    POSTGRES_MAX_RETRIES: int = 5
    POSTGRES_RETRY_DELAY: int = 2

    # --- JWT Settings ---
    PRIVATE_KEY: str = Field(..., env="PRIVATE_KEY")
    PUBLIC_KEY: str = Field(..., env="PUBLIC_KEY")
    ALGORITHM: str = "RS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @field_validator("PRIVATE_KEY", "PUBLIC_KEY")
    @classmethod
    def format_multiline_key(cls, value: str) -> str:
        """
        Ensures that the multi-line JWT keys read from .env files are correctly
        formatted with actual newline characters.
        """
        return value.replace("\\n", "\n")

    # --- OAuth2 Settings (Google) ---
    GOOGLE_CLIENT_ID: str = Field(..., env="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = Field(..., env="GOOGLE_CLIENT_SECRET")

    # --- AI/LLM Settings (Gemini) ---
    GOOGLE_API_KEY: str = Field(..., env="GOOGLE_API_KEY")
    GOOGLE_MODEL_NAME: str = "gemini-2.5-flash-lite"
    EMBEDDING_MODEL_NAME: str = "models/text-embedding-004"

    # --- Qdrant Vector DB Settings ---
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "thucydides_sources"

    # --- Stripe Settings ---
    STRIPE_API_KEY: str = Field(..., env="STRIPE_API_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(..., env="STRIPE_WEBHOOK_SECRET")
    STRIPE_PRICE_ID_SCHOLAR: str = Field(..., env="STRIPE_PRICE_ID_SCHOLAR")
    FRONTEND_URL: str = "http://localhost:3000"

    # --- OAuth2 Settings (GitHub) - can be added later ---
    # GITHUB_CLIENT_ID: str = Field(..., env="GITHUB_CLIENT_ID")
    # GITHUB_CLIENT_SECRET: str = Field(..., env="GITHUB_CLIENT_SECRET")
    # GITHUB_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/github/callback"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached instance of the Settings object.
    Using a cached function ensures settings are loaded only once.
    """
    return Settings()
