import os
from typing import Optional

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

settings = Settings()
