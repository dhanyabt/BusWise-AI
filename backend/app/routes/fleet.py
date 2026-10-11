from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from backend.app.schemas.fleet import FleetSummary, Bus, BusCreateRequest, BusUpdateRequest, StopBusCount
from backend.app.services.database import db_service

router = APIRouter(tags=["Fleet"])

def get_is_officer_or_admin(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> bool:
    """Verify requesting user has Transport Officer or Admin privileges."""
    if x_user_role:
        role = x_user_role.strip().upper()
        return role in ("OFFICER", "TRANSPORT_OFFICER", "ADMIN", "ADMINISTRATOR")
    return False

@router.get("/fleet", response_model=FleetSummary)
def get_fleet_summary(include_deactivated: bool = True):
    """
    Get dynamic fleet status, registered vs available buses, and distribution across bus stops.
    Supports any fleet size (16, 32, 50, etc.) loaded dynamically from database.
    """
    raw_buses = db_service.get_buses(include_deactivated=include_deactivated)
    buses = [Bus(**b) for b in raw_buses]
    stops = db_service.get_stops()
    stop_name_map = {s["id"]: s["name"] for s in stops}

    counts: dict[str, int] = {s["id"]: 0 for s in stops}
    for b in buses:
        if b.status != "DEACTIVATED":
            curr = b.current_stop_id or b.initial_stop_id
            if curr in counts:
                counts[curr] += 1

    dist = [
        StopBusCount(stop_id=s_id, stop_name=stop_name_map.get(s_id, s_id), bus_count=cnt)
        for s_id, cnt in counts.items()
    ]

    registered = len(buses)
    available = sum(1 for b in buses if b.status == "AVAILABLE")
    in_service = sum(1 for b in buses if b.status == "IN_SERVICE")
    maintenance = sum(1 for b in buses if b.status == "MAINTENANCE")
    deactivated = sum(1 for b in buses if b.status == "DEACTIVATED")

    # Fetch active allocations to calculate allocated vs unallocated fleet
    allocations = db_service.get_allocations()
    allocated_count = sum(a.get("bus_count", 0) for a in allocations if a.get("approval_status") == "APPROVED")
    unallocated = max(0, available - allocated_count)

    return FleetSummary(
        registered_fleet=registered,
        available_fleet=available,
        allocated_fleet=allocated_count,
        unallocated_fleet=unallocated,
        total_buses=registered,
        available_buses=available,
        in_service_buses=in_service,
        maintenance_buses=maintenance,
        deactivated_buses=deactivated,
        distribution_by_stop=dist,
        buses=buses,
        is_demo_data=False
    )

@router.post("/fleet", response_model=Bus)
def create_bus(
    payload: BusCreateRequest,
    is_authorized: bool = Depends(get_is_officer_or_admin)
):
    """
    Add a new bus to the registered fleet (Transport Officer / Admin privilege).
    """
    try:
        new_bus = db_service.add_bus(
            bus_number=payload.bus_number,
            capacity=payload.capacity,
            status=payload.status,
            initial_stop_id=payload.initial_stop_id,
            route_id=payload.route_id
        )
        return Bus(**new_bus)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add bus: {str(e)}")

@router.put("/fleet/{bus_id}", response_model=Bus)
def update_bus(
    bus_id: str,
    payload: BusUpdateRequest,
    is_authorized: bool = Depends(get_is_officer_or_admin)
):
    """
    Update an existing bus capacity, status, current stop, or route assignment.
    """
    try:
        updated = db_service.update_bus(
            bus_id=bus_id,
            bus_number=payload.bus_number,
            capacity=payload.capacity,
            status=payload.status,
            current_stop_id=payload.current_stop_id,
            route_id=payload.route_id
        )
        return Bus(**updated)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bus: {str(e)}")

@router.patch("/fleet/{bus_id}/status", response_model=Bus)
def update_bus_status(
    bus_id: str,
    status: str,
    is_authorized: bool = Depends(get_is_officer_or_admin)
):
    """
    Deactivate or reactivate a bus (status = DEACTIVATED | AVAILABLE | IN_SERVICE | MAINTENANCE).
    Deactivated buses are retained for historical audit but excluded from available fleet.
    """
    try:
        updated = db_service.update_bus(bus_id=bus_id, status=status)
        return Bus(**updated)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bus status: {str(e)}")

@router.post("/fleet/reset-demo", response_model=FleetSummary)
def reset_demo_fleet_endpoint():
    """
    Reset fleet distribution to original demo scenario (4 CMBT, 2 Mylapore, 3 Central, 7 T. Nagar).
    """
    db_service.reset_demo_fleet()
    return get_fleet_summary()

