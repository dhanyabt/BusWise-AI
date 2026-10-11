from typing import List, Optional
from pydantic import BaseModel, Field

class RouteRequest(BaseModel):
    origin_lat: float = Field(..., description="Origin latitude coordinate")
    origin_lng: float = Field(..., description="Origin longitude coordinate")
    dest_lat: Optional[float] = Field(None, description="Destination latitude coordinate")
    dest_lng: Optional[float] = Field(None, description="Destination longitude coordinate")
    destination_lat: Optional[float] = Field(None, description="Alias for dest_lat")
    destination_lng: Optional[float] = Field(None, description="Alias for dest_lng")
    origin_name: Optional[str] = Field(None, description="Human-readable origin location name")
    dest_name: Optional[str] = Field(None, description="Human-readable destination location name")
    destination_name: Optional[str] = Field(None, description="Alias for dest_name")
    profile: str = Field("driving-car", description="OpenRouteService routing profile")

    def get_destination_coords(self) -> tuple[float, float]:
        lat = self.dest_lat if self.dest_lat is not None else self.destination_lat
        lng = self.dest_lng if self.dest_lng is not None else self.destination_lng
        if lat is None or lng is None:
            raise ValueError("Destination latitude and longitude are required.")
        return lat, lng

class RouteStep(BaseModel):
    instruction: str
    distance_m: float
    duration_s: float

class RouteResponse(BaseModel):
    success: bool = True
    provider: str = "OpenRouteService"
    distance_km: float
    duration_minutes: float
    coordinates: List[List[float]] = Field(..., description="Road polyline points as [[lat, lng], ...]")
    geometry: Optional[List[List[float]]] = Field(None, description="Alias for Leaflet polyline coordinates")
    steps: List[RouteStep] = []
    summary: str
    origin_name: Optional[str] = None
    dest_name: Optional[str] = None
    bounds: Optional[List[List[float]]] = None

    def model_post_init(self, __context):
        if self.geometry is None:
            self.geometry = self.coordinates

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
