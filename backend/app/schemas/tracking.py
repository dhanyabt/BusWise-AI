from typing import List, Optional
from pydantic import BaseModel, Field

class TrackedVehicle(BaseModel):
    bus_id: str = Field(..., description="BusWise AI Bus ID (e.g. BUS-001)")
    bus_number: str = Field(..., description="Bus registration/display number (e.g. BW-101)")
    device_id: Optional[int] = Field(None, description="Traccar internal device ID if mapped")
    device_name: Optional[str] = Field(None, description="Traccar registered device name")
    latitude: Optional[float] = Field(None, description="Current latitude from GPS fix")
    longitude: Optional[float] = Field(None, description="Current longitude from GPS fix")
    speed_kmh: Optional[float] = Field(None, description="Vehicle ground speed in km/h")
    heading: Optional[float] = Field(None, description="Vehicle heading in degrees (0-360)")
    last_update: Optional[str] = Field(None, description="ISO timestamp of last reported GPS fix")
    status: str = Field(..., description="Status: LIVE | STALE | OFFLINE | NO_GPS_FIX | UNTRACKED")
    is_live_gps: bool = Field(False, description="True only if genuine GPS data was reported by Traccar")
    assigned_stop_id: Optional[str] = Field(None, description="Assigned terminus/stop ID")
    assigned_stop_name: Optional[str] = Field(None, description="Assigned terminus/stop name")
    fleet_status: str = Field("AVAILABLE", description="Fleet operating state: AVAILABLE | IN_SERVICE | MAINTENANCE")
    battery_level: Optional[float] = Field(None, description="Tracker battery level % if provided (officer view only)")

class TraccarStatusResponse(BaseModel):
    is_configured: bool
    traccar_url: str
    connection_status: str = Field(..., description="CONNECTED | UNREACHABLE | AUTH_FAILED | NOT_CONFIGURED")
    message: str
    total_registered_fleet: int
    active_tracked_devices: int
    online_devices: int

class FleetTrackingResponse(BaseModel):
    traccar_status: TraccarStatusResponse
    vehicles: List[TrackedVehicle]
    last_poll_time: str
