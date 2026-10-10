import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "BusWise AI - Crowd Prediction & Fixed-Fleet Optimization"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Environment & CORS
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # Supabase Credentials (Optional for local demo mode)
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # OpenRouteService Configuration (Road routing & geocoding)
    OPENROUTESERVICE_API_KEY: Optional[str] = os.getenv("OPENROUTESERVICE_API_KEY")

    # Traccar Live GPS Tracking Configuration
    TRACCAR_BASE_URL: str = os.getenv("TRACCAR_BASE_URL", "http://localhost:8082").rstrip("/")
    TRACCAR_USER: Optional[str] = os.getenv("TRACCAR_USER")
    TRACCAR_PASSWORD: Optional[str] = os.getenv("TRACCAR_PASSWORD")
    TRACCAR_API_KEY: Optional[str] = os.getenv("TRACCAR_API_KEY")
    # Configurable mapping of Traccar device IDs/names to BusWise bus IDs (JSON string)
    TRACCAR_DEVICE_MAP: str = os.getenv("TRACCAR_DEVICE_MAP", "{}")

settings = Settings()
