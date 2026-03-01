from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str  # Required - must come from .env
    SECRET_KEY: str  # Required - must come from .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OPENAI_API_KEY: Optional[str] = None
    TAVILY_API_KEY: Optional[str] = None
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()