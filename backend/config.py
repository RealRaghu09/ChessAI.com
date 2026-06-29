import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ChessAI"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["*"]

    database_url: str | None = None # Dynamically adds the data when app is connected to the db url
    data_dir: Path = Path(os.getenv("DATA_DIR", str(Path(__file__).parent / "data"))) # else stores the data in data folder in json format

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
# Default values for Elo rating system
    default_elo: int = 1200
    elo_k_factor: int = 32
    default_time_ms: int = 600_000
    default_increment_ms: int = 0
# Rate limits for websocket and API
    ws_rate_limit_per_second: int = 30
    api_rate_limit: str = "60/minute"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() :
    '''
    Get the settings
    '''
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    if not settings.database_url:
        settings.database_url = os.getenv("DATABASE_URL")
    return settings


def clear_settings_cache() :
    '''
    Clear the settings cache
    '''
    get_settings.cache_clear()
