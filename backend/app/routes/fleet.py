from fastapi import APIRouter
from backend.app.schemas.fleet import FleetSummary, Bus, StopBusCount
from backend.app.services.database import db_service

router = APIRouter(tags=["Fleet"])

@router.get("/fleet", response_model=FleetSummary)
def get_fleet_summary():
    """
    Get 16-bus fixed fleet status and distribution across stops.
    """
    raw_buses = db_service.get_buses()
    buses = [Bus(**b) for b in raw_buses]
    stops = db_service.get_stops()
    stop_name_map = {s["id"]: s["name"] for s in stops}

    counts: dict[str, int] = {s["id"]: 0 for s in stops}
    for b in buses:
        curr = b.current_stop_id or b.initial_stop_id
        if curr in counts:
            counts[curr] += 1

    dist = [
        StopBusCount(stop_id=s_id, stop_name=stop_name_map.get(s_id, s_id), bus_count=cnt)
        for s_id, cnt in counts.items()
    ]

    return FleetSummary(
        total_buses=len(buses),
        available_buses=sum(1 for b in buses if b.status == "AVAILABLE"),
        in_service_buses=sum(1 for b in buses if b.status == "IN_SERVICE"),
        maintenance_buses=sum(1 for b in buses if b.status == "MAINTENANCE"),
        distribution_by_stop=dist,
        buses=buses,
        is_demo_data=not db_service.is_connected
    )
