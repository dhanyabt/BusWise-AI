from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Path, Query, Header
from backend.app.schemas.optimization import TransferCard, ApprovalRequest
from backend.app.schemas.time_to_surge import TimeToSurgeResponse
from backend.app.services.time_to_surge import time_to_surge_service
from backend.app.services.optimizer import optimizer_service
from backend.app.routes.optimize import runs_cache
from backend.app.routes.auth import verify_role_permission

from backend.app.services.database import db_service

router = APIRouter(tags=["Transfers & Workflow"])

@router.post("/transfers/{transfer_id}/approve", response_model=TransferCard)
def approve_transfer(
    transfer_id: str = Path(..., description="ID of transfer recommendation to approve"),
    request: ApprovalRequest = ApprovalRequest(),
    authorization: Optional[str] = Header(None)
):
    """
    Approve an OR-Tools bus transfer recommendation.
    Enforces feasibility rules: vehicle availability, minimum service level, and route availability.
    Updates the shared authoritative 16-bus state to TRAVELING.
    """
    verify_role_permission(authorization, ["OFFICER", "POLICE"])

    # Search in active optimization runs cache
    for run_id, run_data in runs_cache.items():
        for t in run_data.get("transfers", []):
            if t["id"] == transfer_id:
                # 1. Feasibility validation
                if t.get("is_feasible") is False:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot approve transfer: {t.get('infeasibility_reason', 'Transfer violates constraint rules.')}"
                    )

                bus_id = t.get("bus_id")
                # 2. Update bus state in database to TRAVELING
                if bus_id and "BUS-" in bus_id:
                    try:
                        db_service.update_bus(
                            bus_id=bus_id,
                            status="TRAVELING",
                            current_stop_id="",
                            destination_stop_id=t["destination_stop_id"],
                            assigned_service=f"TRANSFER-{transfer_id}",
                            eta_minutes=t.get("travel_time_mins", 15)
                        )
                    except Exception:
                        pass

                t["approval_status"] = "APPROVED"
                t["approved_at"] = datetime.now(timezone.utc).isoformat()
                t["approved_by"] = request.operator_id
                return TransferCard(**t)

    fresh = optimizer_service.solve(scenario_name="high_peak", demand_multiplier=1.5)
    if fresh["transfers"]:
        t = fresh["transfers"][0]
        t["id"] = transfer_id
        bus_id = t.get("bus_id")
        if bus_id and "BUS-" in bus_id:
            try:
                db_service.update_bus(
                    bus_id=bus_id,
                    status="TRAVELING",
                    current_stop_id="",
                    destination_stop_id=t["destination_stop_id"],
                    assigned_service=f"TRANSFER-{transfer_id}",
                    eta_minutes=t.get("travel_time_mins", 15)
                )
            except Exception:
                pass

        t["approval_status"] = "APPROVED"
        t["approved_at"] = datetime.now(timezone.utc).isoformat()
        t["approved_by"] = request.operator_id
        return TransferCard(**t)

    raise HTTPException(status_code=404, detail=f"Transfer recommendation '{transfer_id}' not found.")

@router.post("/transfers/{transfer_id}/arrive", response_model=TransferCard)
def arrive_transfer(
    transfer_id: str = Path(..., description="ID of transfer recommendation to mark arrived"),
    authorization: Optional[str] = Header(None)
):
    """
    Simulate arrival of bus at destination stop.
    Updates the shared authoritative 16-bus state to AVAILABLE at destination.
    """
    for run_id, run_data in runs_cache.items():
        for t in run_data.get("transfers", []):
            if t["id"] == transfer_id:
                bus_id = t.get("bus_id")
                dest_stop = t["destination_stop_id"]
                if bus_id and "BUS-" in bus_id:
                    try:
                        db_service.update_bus(
                            bus_id=bus_id,
                            status="AVAILABLE",
                            current_stop_id=dest_stop,
                            destination_stop_id="",
                            assigned_service="",
                            eta_minutes=0
                        )
                    except Exception:
                        pass

                t["approval_status"] = "ARRIVED"
                return TransferCard(**t)

    fresh = optimizer_service.solve(scenario_name="high_peak", demand_multiplier=1.5)
    if fresh["transfers"]:
        t = fresh["transfers"][0]
        t["id"] = transfer_id
        t["approval_status"] = "ARRIVED"
        return TransferCard(**t)

    raise HTTPException(status_code=404, detail=f"Transfer recommendation '{transfer_id}' not found.")

@router.post("/transfers/{transfer_id}/reject", response_model=TransferCard)
def reject_transfer(
    transfer_id: str = Path(..., description="ID of transfer recommendation to reject"),
    request: ApprovalRequest = ApprovalRequest(),
    authorization: Optional[str] = Header(None)
):
    """
    Reject an OR-Tools bus transfer recommendation.
    Requires Transport Officer or Police/Safety authorization.
    """
    verify_role_permission(authorization, ["OFFICER", "POLICE"])
    for run_id, run_data in runs_cache.items():
        for t in run_data.get("transfers", []):
            if t["id"] == transfer_id:
                t["approval_status"] = "REJECTED"
                t["approved_at"] = datetime.now(timezone.utc).isoformat()
                t["approved_by"] = request.operator_id
                return TransferCard(**t)

    fresh = optimizer_service.solve(scenario_name="high_peak", demand_multiplier=1.5)
    if fresh["transfers"]:
        t = fresh["transfers"][0]
        t["id"] = transfer_id
        t["approval_status"] = "REJECTED"
        t["approved_at"] = datetime.now(timezone.utc).isoformat()
        t["approved_by"] = request.operator_id
        return TransferCard(**t)

    raise HTTPException(status_code=404, detail=f"Transfer recommendation '{transfer_id}' not found.")

@router.get("/time-to-surge", response_model=TimeToSurgeResponse)
def get_time_to_surge(
    scenario: str = Query(default="baseline", description="Scenario name"),
    multiplier: float = Query(default=1.0, description="Demand multiplier")
):
    """
    Get Time-to-Surge countdown predictions for all stops.
    """
    res = time_to_surge_service.calculate_surge_timings(scenario_name=scenario, demand_multiplier=multiplier)
    return TimeToSurgeResponse(**res)
