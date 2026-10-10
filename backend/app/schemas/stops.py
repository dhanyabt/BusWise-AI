from pydantic import BaseModel, Field
from typing import Optional

class BusStop(BaseModel):
    id: str = Field(..., json_schema_extra={"example": "STOP-001"})
    name: str = Field(..., json_schema_extra={"example": "Main Stand"})
    location_lat: float = Field(..., json_schema_extra={"example": 12.9716})
    location_lng: float = Field(..., json_schema_extra={"example": 77.5946})
    capacity: int = Field(default=500, json_schema_extra={"example": 500})
    minimum_service_level: int = Field(default=1, json_schema_extra={"example": 2})
    description: Optional[str] = None
    initial_queue: int = Field(default=0, json_schema_extra={"example": 120})

class BusStopResponse(BaseModel):
    stops: list[BusStop]
    total_stops: int
    is_demo_data: bool = True
