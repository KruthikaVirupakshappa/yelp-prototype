from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
from pathlib import Path


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OPENAI_API_KEY: Optional[str] = None
    TAVILY_API_KEY: Optional[str] = None
    UPLOAD_DIR: str = "uploads"
    OLLAMA_MODEL: str = "llama3.2:3b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    s = Settings()

   
    if s.DATABASE_URL.startswith("sqlite:///./"):
        backend_dir = Path(__file__).resolve().parents[1]  
        db_path = backend_dir / s.DATABASE_URL.replace("sqlite:///./", "")
        s.DATABASE_URL = f"sqlite:///{db_path}"

    return s