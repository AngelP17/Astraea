from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Astraea"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api"

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_MINUTE_AUTH: int = 10

    DATABASE_URL: str | None = None

    SECRET_KEY: str = "change-me-in-production"

    ARTIFACTS_DIR: str = "artifacts"
    MAX_FILE_SIZE_MB: int = 10

    # Optional Floci local cloud emulation configuration
    FLOCI_ENABLED: bool = False
    FLOCI_URL: str = "http://localhost:4566"
    FLOCI_BUCKET: str = "astraea-audit-proofs"
    FLOCI_QUEUE_URL: str = "http://localhost:4566/000000000000/astraea-ingest-queue"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
