from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from backend.app.schemas.tracking import TraccarStatusResponse, FleetTrackingResponse
from backend.app.services.traccar import traccar_service

router = APIRouter(prefix="/tracking", tags=["Live GPS Tracking"])

def get_is_officer(x_user_role: Optional[str] = Header(None, alias="X-User-Role")) -> bool:
    """Check if the requesting user has officer privileges from request header."""
    if x_user_role:
        role = x_user_role.strip().upper()
        return role in ("OFFICER", "TRANSPORT_OFFICER", "ADMIN", "POLICE")
    return False

@router.get("/status", response_model=TraccarStatusResponse)
async def get_traccar_status():
    """
    Check connectivity and configuration status with Traccar GPS tracking backend.
    """
    try:
        return await traccar_service.get_traccar_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Traccar status: {str(e)}")

@router.get("/vehicles", response_model=FleetTrackingResponse)
async def get_tracked_vehicles(is_officer: bool = Depends(get_is_officer)):
    """
    Retrieve live GPS vehicle locations for registered BusWise fleet.
    Filters operational metadata based on user role.
    """
    try:
        return await traccar_service.get_fleet_tracking(is_officer=is_officer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tracked vehicles: {str(e)}")
