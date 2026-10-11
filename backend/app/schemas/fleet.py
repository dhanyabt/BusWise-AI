from pydantic import BaseModel, Field
from typing import Optional, List

class Bus(BaseModel):
    id: str = Field(..., json_schema_extra={"example": "BUS-001"})
    bus_number: str = Field(..., json_schema_extra={"example": "BW-101"})
    capacity: int = Field(default=60, json_schema_extra={"example": 60})
    status: str = Field(default="AVAILABLE", json_schema_extra={"example": "AVAILABLE"}) # AVAILABLE | IN_SERVICE | TRAVELING | UNAVAILABLE | MAINTENANCE | DEACTIVATED
    initial_stop_id: Optional[str] = Field(default=None, json_schema_extra={"example": "STOP-001"})
    current_stop_id: Optional[str] = Field(default=None, json_schema_extra={"example": "STOP-001"})
    destination_stop_id: Optional[str] = Field(default=None, json_schema_extra={"example": "STOP-003"})
    route_id: Optional[str] = Field(default=None, json_schema_extra={"example": "RTE-01"})
    assigned_service: Optional[str] = Field(default=None, json_schema_extra={"example": "TRANSFER-001"})
    eta_minutes: Optional[int] = Field(default=None, json_schema_extra={"example": 15})
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class BusCreateRequest(BaseModel):
    bus_number: str = Field(..., description="Bus registration/display code (e.g. BW-501)")
    capacity: int = Field(60, ge=10, le=200, description="Passenger capacity")
    status: str = Field("AVAILABLE", description="Status: AVAILABLE | IN_SERVICE | MAINTENANCE | DEACTIVATED")
    initial_stop_id: Optional[str] = Field("STOP-001", description="Assigned terminus/stop ID")
    route_id: Optional[str] = Field(None, description="Assigned route ID")

class BusUpdateRequest(BaseModel):
    bus_number: Optional[str] = Field(None, description="Bus registration/display code")
    capacity: Optional[int] = Field(None, ge=10, le=200, description="Passenger capacity")
    status: Optional[str] = Field(None, description="Status: AVAILABLE | IN_SERVICE | TRAVELING | UNAVAILABLE | MAINTENANCE | DEACTIVATED")
    current_stop_id: Optional[str] = Field(None, description="Current stop ID")
    destination_stop_id: Optional[str] = Field(None, description="Destination stop ID when traveling")
    route_id: Optional[str] = Field(None, description="Assigned route ID")
    assigned_service: Optional[str] = Field(None, description="Assigned transfer or route service")
    eta_minutes: Optional[int] = Field(None, description="Estimated arrival time in minutes")

class StopBusCount(BaseModel):
    stop_id: str
    stop_name: str
    bus_count: int

class FleetSummary(BaseModel):
    registered_fleet: int = Field(..., description="Total buses recorded in database")
    available_fleet: int = Field(..., description="Eligible buses ready for service (excludes deactivated/maintenance)")
    allocated_fleet: int = Field(0, description="Buses currently assigned to active transfers/events")
    unallocated_fleet: int = Field(..., description="Available buses not currently assigned")
    total_buses: int = Field(..., description="Alias for registered_fleet")
    available_buses: int = Field(..., description="Alias for available_fleet")
    in_service_buses: int = 0
    maintenance_buses: int = 0
    deactivated_buses: int = 0
    distribution_by_stop: List[StopBusCount]
    buses: List[Bus]
    is_demo_data: bool = False
