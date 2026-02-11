"""
API Configuration Settings
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Application settings
    """
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Furniture Calculator API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "API за изчисляване на мебели и кухненски шкафове"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS Settings - хардкоднати за простота
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
    ]
    
    # Database Settings (за бъдещо ползване)
    DATABASE_URL: str = "sqlite:///./furniture_calculator.db"
    
    # Cache Settings
    REDIS_URL: str = "redis://localhost:6379"
    
    # Material Settings
    DEFAULT_MATERIAL_THICKNESS: float = 18.0
    DEFAULT_BACK_THICKNESS: float = 3.0
    DEFAULT_DOOR_GAP: float = 3.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()