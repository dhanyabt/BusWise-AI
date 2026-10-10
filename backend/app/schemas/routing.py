from typing import List, Optional
from pydantic import BaseModel, Field

class RouteRequest(BaseModel):
    origin_lat: float = Field(..., description="Origin latitude coordinate")
    origin_lng: float = Field(..., description="Origin longitude coordinate")
    dest_lat: float = Field(..., description="Destination latitude coordinate")
    dest_lng: float = Field(..., description="Destination longitude coordinate")
    origin_name: Optional[str] = Field(None, description="Human-readable origin location name")
    dest_name: Optional[str] = Field(None, description="Human-readable destination location name")
    profile: str = Field("driving-car", description="OpenRouteService routing profile (e.g. driving-car, driving-hgv)")

class RouteStep(BaseModel):
    instruction: str
    distance_m: float
    duration_s: float

class RouteResponse(BaseModel):
    success: bool
    provider: str = "OpenRouteService"
    distance_km: float
    duration_minutes: float
    coordinates: List[List[float]] = Field(..., description="Road polyline points as [[lat, lng], ...]")
    steps: List[RouteStep] = []
    summary: str
    origin_name: Optional[str] = None
    dest_name: Optional[str] = None
    bounds: Optional[List[List[float]]] = None

class LocationSearchItem(BaseModel):
    id: str
    name: str
    display_name: str
    lat: float
    lng: float
    type: Optional[str] = "location"

class LocationSearchResponse(BaseModel):
    query: str
    results: List[LocationSearchItem]
    total: int
    provider: str
