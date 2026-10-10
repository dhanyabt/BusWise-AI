from pydantic import BaseModel, Field
from typing import Optional, List

class Bus(BaseModel):
    id: str = Field(..., json_schema_extra={"example": "BUS-001"})
    bus_number: str = Field(..., json_schema_extra={"example": "BW-101"})
    capacity: int = Field(default=60, json_schema_extra={"example": 60})
    status: str = Field(default="AVAILABLE", json_schema_extra={"example": "AVAILABLE"})
    initial_stop_id: Optional[str] = Field(default=None, json_schema_extra={"example": "STOP-001"})
    current_stop_id: Optional[str] = Field(default=None, json_schema_extra={"example": "STOP-001"})

class StopBusCount(BaseModel):
    stop_id: str
    stop_name: str
    bus_count: int

class FleetSummary(BaseModel):
    total_buses: int = 16
    available_buses: int = 16
    in_service_buses: int = 0
    maintenance_buses: int = 0
    distribution_by_stop: List[StopBusCount]
    buses: List[Bus]
    is_demo_data: bool = True
