"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Pydantic v2 settings loaded from environment variables."""

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/egm_ai"

    # LLM
    llm_base_url: str = "https://api.moonshot.cn/v1"
    llm_api_key: str = ""
    llm_model: str = "kimi-latest"

    # Backend
    backend_port: int = 8000
    backend_cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176"
    debug: bool = False

    # Agent simulation mode (for pilot without real LLM)
    simulation_mode: bool = True

    # n8n integration
    n8n_base_url: str = "http://localhost:5678"
    n8n_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = ""
        extra = "ignore"


settings = Settings()
