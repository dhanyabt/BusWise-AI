import json
import logging
import httpx
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from backend.app.config import settings
from backend.app.schemas.tracking import (
    TrackedVehicle,
    TraccarStatusResponse,
    FleetTrackingResponse
)
from backend.app.services.database import db_service

logger = logging.getLogger(__name__)

class TraccarService:
    def __init__(self):
        self.base_url = settings.TRACCAR_BASE_URL.rstrip("/")
        self.user = settings.TRACCAR_USER
        self.password = settings.TRACCAR_PASSWORD
        self.api_key = settings.TRACCAR_API_KEY
        
        # Load user-configured device mapping (e.g. {"1": "BUS-001"} or {"BW-101": "BUS-001"})
        self.device_map = {}
        if settings.TRACCAR_DEVICE_MAP:
            try:
                self.device_map = json.loads(settings.TRACCAR_DEVICE_MAP)
            except Exception as e:
                logger.warning(f"Could not parse TRACCAR_DEVICE_MAP JSON: {e}")

    def _get_auth_kwargs(self) -> dict:
        """Returns httpx auth header or auth tuple if configured."""
        if self.api_key:
            return {"headers": {"Authorization": f"Bearer {self.api_key}"}}
        elif self.user and self.password:
            return {"auth": (self.user, self.password)}
        return {}

    def is_configured(self) -> bool:
        """Check if minimum Traccar credentials/URL are configured."""
        return bool(self.base_url and (self.api_key or (self.user and self.password)))

    async def get_traccar_status(self) -> TraccarStatusResponse:
        """Ping Traccar server to verify connectivity and auth status."""
        buses = db_service.get_buses()
        total_fleet = len(buses)

        if not self.is_configured():
            return TraccarStatusResponse(
                is_configured=False,
                traccar_url=self.base_url,
                connection_status="NOT_CONFIGURED",
                message="Traccar credentials (TRACCAR_USER/TRACCAR_PASSWORD or TRACCAR_API_KEY) are not configured in environment.",
                total_registered_fleet=total_fleet,
                active_tracked_devices=0,
                online_devices=0
            )

        auth_kwargs = self._get_auth_kwargs()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/devices", **auth_kwargs)
                if res.status_code in (401, 403):
                    return TraccarStatusResponse(
                        is_configured=True,
                        traccar_url=self.base_url,
                        connection_status="AUTH_FAILED",
                        message=f"Traccar authentication failed (HTTP {res.status_code}). Check TRACCAR_USER/PASSWORD or TRACCAR_API_KEY.",
                        total_registered_fleet=total_fleet,
                        active_tracked_devices=0,
                        online_devices=0
                    )
                res.raise_for_status()
                devices = res.json()
                active_count = len(devices)
                online_count = sum(1 for d in devices if d.get("status") == "online")

                return TraccarStatusResponse(
                    is_configured=True,
                    traccar_url=self.base_url,
                    connection_status="CONNECTED",
                    message=f"Successfully connected to Traccar server at {self.base_url}.",
                    total_registered_fleet=total_fleet,
                    active_tracked_devices=active_count,
                    online_devices=online_count
                )
        except httpx.HTTPError as e:
            logger.warning(f"Traccar connection error: {e}")
            return TraccarStatusResponse(
                is_configured=True,
                traccar_url=self.base_url,
                connection_status="UNREACHABLE",
                message=f"Traccar server is unreachable: {str(e)}",
                total_registered_fleet=total_fleet,
                active_tracked_devices=0,
                online_devices=0
            )
        except Exception as e:
            logger.error(f"Unexpected error checking Traccar status: {e}")
            return TraccarStatusResponse(
                is_configured=True,
                traccar_url=self.base_url,
                connection_status="UNREACHABLE",
                message=f"Unexpected error: {str(e)}",
                total_registered_fleet=total_fleet,
                active_tracked_devices=0,
                online_devices=0
            )

    async def get_fleet_tracking(self, is_officer: bool = False) -> FleetTrackingResponse:
        """
        Retrieves real-time vehicle locations from Traccar API and correlates them with
        registered BusWise AI buses. Strictly avoids fabricating fake GPS positions.
        """
        raw_buses = db_service.get_buses()
        raw_stops = db_service.get_stops()
        stop_map = {s["id"]: s["name"] for s in raw_stops}

        status = await self.get_traccar_status()
        tracked_vehicles: List[TrackedVehicle] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        # If Traccar is not configured or unreachable, return registered fleet with UNTRACKED/OFFLINE status
        if status.connection_status != "CONNECTED":
            for b in raw_buses:
                stop_id = b.get("current_stop_id") or b.get("initial_stop_id")
                vehicle = TrackedVehicle(
                    bus_id=b["id"],
                    bus_number=b["bus_number"],
                    device_id=None,
                    device_name=None,
                    latitude=None,
                    longitude=None,
                    speed_kmh=None,
                    heading=None,
                    last_update=None,
                    status="UNTRACKED" if not status.is_configured else "OFFLINE",
                    is_live_gps=False,
                    assigned_stop_id=stop_id,
                    assigned_stop_name=stop_map.get(stop_id),
                    fleet_status=b.get("status", "AVAILABLE"),
                    battery_level=None if not is_officer else None
                )
                tracked_vehicles.append(vehicle)

            return FleetTrackingResponse(
                traccar_status=status,
                vehicles=tracked_vehicles,
                last_poll_time=now_iso
            )

        # Traccar is connected - fetch devices & positions
        auth_kwargs = self._get_auth_kwargs()
        devices_by_id = {}
        positions_by_device_id = {}

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                dev_res = await client.get(f"{self.base_url}/api/devices", **auth_kwargs)
                if dev_res.status_code == 200:
                    for d in dev_res.json():
                        devices_by_id[d.get("id")] = d

                pos_res = await client.get(f"{self.base_url}/api/positions", **auth_kwargs)
                if pos_res.status_code == 200:
                    for p in pos_res.json():
                        positions_by_device_id[p.get("deviceId")] = p
        except Exception as e:
            logger.error(f"Error fetching devices/positions from Traccar: {e}")

        # Map devices to BusWise buses
        # Lookup helper
        def find_device_for_bus(bus_id: str, bus_num: str) -> Optional[dict]:
            # Check explicit mapping in self.device_map first
            for dev_id, target in self.device_map.items():
                if target in (bus_id, bus_num):
                    try:
                        int_id = int(dev_id)
                        if int_id in devices_by_id:
                            return devices_by_id[int_id]
                    except ValueError:
                        pass

            # Auto match by name or uniqueId
            for d in devices_by_id.values():
                d_name = str(d.get("name", "")).strip().upper()
                d_uid = str(d.get("uniqueId", "")).strip().upper()
                b_id = bus_id.upper()
                b_num = bus_num.upper()
                if d_name in (b_id, b_num) or d_uid in (b_id, b_num):
                    return d
            return None

        for b in raw_buses:
            stop_id = b.get("current_stop_id") or b.get("initial_stop_id")
            dev = find_device_for_bus(b["id"], b["bus_number"])
            
            if not dev:
                vehicle = TrackedVehicle(
                    bus_id=b["id"],
                    bus_number=b["bus_number"],
                    device_id=None,
                    device_name=None,
                    latitude=None,
                    longitude=None,
                    speed_kmh=None,
                    heading=None,
                    last_update=None,
                    status="UNTRACKED",
                    is_live_gps=False,
                    assigned_stop_id=stop_id,
                    assigned_stop_name=stop_map.get(stop_id),
                    fleet_status=b.get("status", "AVAILABLE"),
                    battery_level=None
                )
            else:
                dev_id = dev.get("id")
                pos = positions_by_device_id.get(dev_id, {})
                dev_status = dev.get("status", "unknown")

                lat = pos.get("latitude")
                lng = pos.get("longitude")
                speed = pos.get("speed")  # knots or kmh depending on config, convert to km/h if needed (1 knot = 1.852 kmh)
                if speed is not None:
                    speed_kmh = round(speed * 1.852, 1)
                else:
                    speed_kmh = None

                fix_time = pos.get("deviceTime") or pos.get("fixTime") or dev.get("lastUpdate")
                
                # Check status
                if not lat or not lng:
                    status_str = "NO_GPS_FIX"
                    is_live = False
                elif dev_status == "offline":
                    status_str = "OFFLINE"
                    is_live = True
                else:
                    status_str = "LIVE"
                    is_live = True

                battery = None
                if is_officer and pos.get("attributes"):
                    battery = pos["attributes"].get("batteryLevel") or pos["attributes"].get("battery")

                vehicle = TrackedVehicle(
                    bus_id=b["id"],
                    bus_number=b["bus_number"],
                    device_id=dev_id,
                    device_name=dev.get("name"),
                    latitude=lat,
                    longitude=lng,
                    speed_kmh=speed_kmh,
                    heading=pos.get("course"),
                    last_update=fix_time,
                    status=status_str,
                    is_live_gps=is_live,
                    assigned_stop_id=stop_id,
                    assigned_stop_name=stop_map.get(stop_id),
                    fleet_status=b.get("status", "AVAILABLE"),
                    battery_level=battery
                )
            tracked_vehicles.append(vehicle)

        return FleetTrackingResponse(
            traccar_status=status,
            vehicles=tracked_vehicles,
            last_poll_time=now_iso
        )

traccar_service = TraccarService()
