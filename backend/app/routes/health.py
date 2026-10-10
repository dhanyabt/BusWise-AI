from fastapi import APIRouter
from backend.app.services.database import db_service
from backend.app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """
    Health check endpoint.
    Guaranteed to work whether Supabase credentials are configured or in demo mode.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "supabase_connected": db_service.is_connected,
        "demo_mode": not db_service.is_connected,
        "message": "BusWise AI Core System is operational."
    }
