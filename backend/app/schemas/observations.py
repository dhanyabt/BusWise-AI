"""
Pydantic schemas for Event Manager manual crowd-count observations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class CrowdObservationCreate(BaseModel):
    event_id: str = Field(..., description="ID or code of the event")
    occurrence_id: Optional[str] = Field(None, description="Specific event occurrence ID if applicable")
    location: str = Field(..., description="Bus stand name or venue location")
    observed_count: int = Field(..., ge=0, description="Observed crowd count (non-negative)")
    observed_at: str = Field(..., description="Observation timestamp (ISO string or YYYY-MM-DD HH:MM)")
    notes: Optional[str] = Field(None, description="Optional notes from ground team")
    source: Optional[str] = Field("Ground Observation", description="Reporting source (e.g., Gate Counter, CCTV, Patrol)")


class CrowdObservationUpdate(BaseModel):
    observed_count: Optional[int] = Field(None, ge=0)
    location: Optional[str] = None
    observed_at: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None


class CrowdObservationResponse(BaseModel):
    id: int
    event_id: str
    occurrence_id: Optional[str] = None
    location: str
    observed_count: int
    observed_at: str
    reported_by: str
    notes: Optional[str] = None
    source: Optional[str] = "Ground Observation"
    created_at: str
    edited_by: Optional[str] = None
    edited_at: Optional[str] = None
    audit_trail: Optional[List[Any]] = None
    is_manually_reported: bool = True
