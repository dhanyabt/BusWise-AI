"""
BusWise AI - Event Manager Manual Crowd-Count Reporting Endpoints
Provides authenticated CRUD endpoints with role RBAC & audit trails for ground observations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional, Dict, Any
from backend.app.services.database import db_service
from backend.app.routes.auth import get_current_user
from backend.app.schemas.observations import (
    CrowdObservationCreate,
    CrowdObservationUpdate,
    CrowdObservationResponse
)

router = APIRouter(prefix="/events", tags=["observations"])

ALLOWED_ROLES = ["EVENT_MANAGER", "ADMINISTRATOR", "TRANSPORT_OFFICER"]


def verify_observation_permission(current_user: Any = Depends(get_current_user)):
    """Enforce Event Manager, Administrator, or Transport Officer role."""
    if isinstance(current_user, dict):
        role = current_user.get("role", "PASSENGER").upper()
    else:
        role = getattr(current_user, "role", "PASSENGER").upper()

    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Role '{role}' is not authorized to submit or edit crowd count observations. Required: EVENT_MANAGER, ADMINISTRATOR, or TRANSPORT_OFFICER."
        )
    return current_user


@router.post("/observations", response_model=CrowdObservationResponse, status_code=status.HTTP_201_CREATED)
def create_crowd_observation(
    payload: CrowdObservationCreate,
    current_user: Any = Depends(verify_observation_permission)
):
    """
    Record an observed ground crowd count.
    Enforces RBAC permissions, non-negative crowd counts, and persists to SQLite.
    """
    try:
        if isinstance(current_user, dict):
            reporter = current_user.get("email") or current_user.get("name") or "Event Manager"
        else:
            reporter = getattr(current_user, "email", None) or getattr(current_user, "name", None) or "Event Manager"

        res = db_service.add_crowd_observation(
            event_id=payload.event_id,
            occurrence_id=payload.occurrence_id,
            location=payload.location,
            observed_count=payload.observed_count,
            observed_at=payload.observed_at,
            reported_by=reporter,
            notes=payload.notes,
            source=payload.source or "Ground Observation"
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to record observation: {e}")


@router.get("/observations", response_model=List[CrowdObservationResponse])
def list_crowd_observations(
    event_id: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500)
):
    """
    List recorded ground observations (publicly viewable across roles for operational transparency).
    """
    return db_service.get_crowd_observations(event_id=event_id, location=location, limit=limit)


@router.get("/observations/{obs_id}", response_model=CrowdObservationResponse)
def get_crowd_observation(obs_id: int):
    """
    Retrieve a specific crowd observation record including its audit trail.
    """
    obs = db_service.get_crowd_observation_by_id(obs_id)
    if not obs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Observation with ID {obs_id} not found.")
    return obs


@router.put("/observations/{obs_id}", response_model=CrowdObservationResponse)
def update_crowd_observation(
    obs_id: int,
    payload: CrowdObservationUpdate,
    current_user: Any = Depends(verify_observation_permission)
):
    """
    Edit or correct a recorded crowd observation.
    Maintains an audit trail of previous values and logs who performed the correction.
    """
    try:
        if isinstance(current_user, dict):
            editor = current_user.get("email") or current_user.get("name") or "Event Manager"
        else:
            editor = getattr(current_user, "email", None) or getattr(current_user, "name", None) or "Event Manager"

        updated = db_service.update_crowd_observation(
            obs_id=obs_id,
            observed_count=payload.observed_count,
            location=payload.location,
            observed_at=payload.observed_at,
            notes=payload.notes,
            source=payload.source,
            edited_by=editor
        )
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Observation ID {obs_id} not found.")
        return updated
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update observation: {e}")


@router.delete("/observations/{obs_id}", status_code=status.HTTP_200_OK)
def delete_crowd_observation(
    obs_id: int,
    current_user: Dict[str, Any] = Depends(verify_observation_permission)
):
    """
    Delete a crowd observation entry (requires Event Manager, Admin, or Transport Officer).
    """
    success = db_service.delete_crowd_observation(obs_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Observation ID {obs_id} not found.")
    return {"status": "success", "message": f"Observation {obs_id} deleted."}


@router.get("/{event_id}/latest-observation")
def get_latest_event_observation(event_id: str, location: Optional[str] = Query(None)):
    """
    Retrieve the most recent ground crowd observation for an event.
    Explicitly labeled 'Manually reported' rather than automatically calling it live.
    """
    latest = db_service.get_latest_crowd_observation(event_id=event_id, location=location)
    if not latest:
        return {
            "has_observation": False,
            "event_id": event_id,
            "message": "No manual crowd observation recorded for this event yet.",
            "label": "No Manual Reports"
        }
    
    return {
        "has_observation": True,
        "event_id": event_id,
        "observation": latest,
        "label": "Manually reported",
        "provenance_note": f"Manually reported by {latest.get('reported_by')} at {latest.get('observed_at')}"
    }
