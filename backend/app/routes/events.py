from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from backend.app.services.database import db_service

router = APIRouter(prefix="/events", tags=["Event Management"])

class EventCreateRequest(BaseModel):
    event_id: Optional[str] = Field(None, description="Unique Event ID (e.g. EVT_TN_501)")
    event_name: str = Field(..., description="Event name (e.g. Madurai Chithirai Thiruvizha)")
    event_type: str = Field(..., description="Event classification (e.g. Religious & Temple Festival)")
    district: str = Field(..., description="District in Tamil Nadu")
    city_or_town: str = Field(..., description="City or town")
    event_date: str = Field(..., description="Event date (YYYY-MM-DD)")
    event_start_time: str = Field("08:00", description="Start time (HH:MM)")
    event_end_time: str = Field("22:00", description="End time (HH:MM)")
    expected_attendance: int = Field(..., ge=0, description="Expected attendee count")
    actual_attendance: Optional[int] = Field(None, description="Actual attendance if recorded")
    bus_stand_id: Optional[str] = Field("BS_MAD_01", description="Associated bus stand ID")

class OccurrenceUpdateRequest(BaseModel):
    expected_attendance: Optional[int] = None
    user_observed_attendance: Optional[int] = None
    event_start_time: Optional[str] = None
    event_end_time: Optional[str] = None

def get_is_event_manager_or_higher(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> bool:
    if x_user_role:
        role = x_user_role.strip().upper()
        return role in ("EVENT_MANAGER", "OFFICER", "TRANSPORT_OFFICER", "ADMIN", "ADMINISTRATOR")
    return False

@router.get("")
def list_events():
    """
    List historical and managed festival events and occurrences in Tamil Nadu.
    """
    with db_service._get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM event_occurrences ORDER BY event_date DESC LIMIT 100")
        rows = cursor.fetchall()
        occurrences = [dict(r) for r in rows]

    return {
        "total_occurrences": len(occurrences),
        "events": occurrences,
        "provenance_notice": "Dataset-provided — provenance unverified for historical rows; Operational edits tagged separately."
    }

@router.post("")
def create_event(
    payload: EventCreateRequest,
    is_authorized: bool = Depends(get_is_event_manager_or_higher)
):
    """
    Create a new festival/event record (Event Manager / Officer privilege).
    Persists separately from original imported CSV rows.
    """
    evt_id = payload.event_id or f"EVT_MANUAL_{int(datetime.now(timezone.utc).timestamp())}"
    occ_id = f"{evt_id}_{payload.event_date.replace('-', '')}"
    now_iso = datetime.now(timezone.utc).isoformat()

    with db_service._get_connection() as conn:
        cursor = conn.cursor()
        # Insert master event
        cursor.execute("""
            INSERT OR REPLACE INTO events (id, event_name, event_type, district, city_or_town, provenance)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (evt_id, payload.event_name, payload.event_type, payload.district, payload.city_or_town, "User-created Event Manager record"))

        # Insert occurrence
        cursor.execute("""
            INSERT OR REPLACE INTO event_occurrences (
                id, event_id, event_name, event_type, district, city_or_town,
                event_date, event_start_time, event_end_time, expected_attendance,
                actual_attendance, user_observed_attendance, provenance, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            occ_id, evt_id, payload.event_name, payload.event_type,
            payload.district, payload.city_or_town, payload.event_date,
            payload.event_start_time, payload.event_end_time, payload.expected_attendance,
            payload.actual_attendance or payload.expected_attendance,
            payload.actual_attendance,
            "User-created Event Manager record", now_iso
        ))

        # Insert bus stand link if specified
        if payload.bus_stand_id:
            cursor.execute("""
                INSERT OR REPLACE INTO occurrence_bus_stands (id, event_occurrence_id, bus_stand_id, bus_stand_name, bus_stand_passenger_count)
                VALUES (?, ?, ?, ?, ?)
            """, (
                f"{occ_id}_{payload.bus_stand_id}",
                occ_id,
                payload.bus_stand_id,
                payload.bus_stand_id,
                int(payload.expected_attendance * 0.15)
            ))

        conn.commit()

    return {
        "status": "success",
        "event_id": evt_id,
        "occurrence_id": occ_id,
        "message": f"Event '{payload.event_name}' created successfully."
    }

@router.put("/occurrences/{occurrence_id}")
def update_occurrence(
    occurrence_id: str,
    payload: OccurrenceUpdateRequest,
    is_authorized: bool = Depends(get_is_event_manager_or_higher)
):
    """
    Update attendance estimates or record user-observed attendance for an event occurrence.
    """
    updates = []
    params = []
    if payload.expected_attendance is not None:
        updates.append("expected_attendance = ?")
        params.append(payload.expected_attendance)
    if payload.user_observed_attendance is not None:
        updates.append("user_observed_attendance = ?")
        params.append(payload.user_observed_attendance)
    if payload.event_start_time:
        updates.append("event_start_time = ?")
        params.append(payload.event_start_time)
    if payload.event_end_time:
        updates.append("event_end_time = ?")
        params.append(payload.event_end_time)

    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    params.append(occurrence_id)
    with db_service._get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE event_occurrences SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Occurrence '{occurrence_id}' not found.")

    return {"status": "success", "occurrence_id": occurrence_id, "updated_fields": len(updates)}
