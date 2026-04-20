"""Application configuration settings."""

import os
from functools import lru_cache
from typing import Optional


class Settings:
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "InterviewPilot"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "sqlite:///./data/interviewpilot.db"

    # DashScope API (阿里云)
    DASHSCOPE_API_KEY: Optional[str] = None
    DASHSCOPE_API_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    DASHSCOPE_MODEL: str = "qwen-plus"

    # Paraformer Speech Recognition
    PARAFORMER_WS_URL: str = "wss://dashscope.aliyuncs.com/api-ws/v1/inference"
    PARAFORMER_MODEL: str = "paraformer-realtime-v2"

    # LLM Settings
    LLM_MAX_TOKENS: int = 2000
    LLM_TEMPERATURE: float = 0.7
    LLM_TIMEOUT: int = 30

    # Logging Settings
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"
    LOG_MAX_DAYS: int = 7

    # Interview Settings
    DEFAULT_MAX_QUESTIONS: int = 10
    DEFAULT_MAX_DURATION: int = 1800  # seconds

    # Frontend URL (for CORS)
    FRONTEND_URL: str = "http://localhost:5173"

    def __init__(self):
        # Load from environment
        self.DEBUG = os.getenv("DEBUG", "false").lower() == "true"
        self.DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
        self.DATABASE_URL = os.getenv("DATABASE_URL", self.DATABASE_URL)
        self.FRONTEND_URL = os.getenv("FRONTEND_URL", self.FRONTEND_URL)
        # Paraformer speech recognition config
        self.PARAFORMER_WS_URL = os.getenv("PARAFORMER_WS_URL", self.PARAFORMER_WS_URL)
        self.PARAFORMER_MODEL = os.getenv("PARAFORMER_MODEL", self.PARAFORMER_MODEL)
        # Logging config
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", self.LOG_LEVEL)
        self.LOG_DIR = os.getenv("LOG_DIR", self.LOG_DIR)
        self.LOG_MAX_DAYS = int(os.getenv("LOG_MAX_DAYS", str(self.LOG_MAX_DAYS)))


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
