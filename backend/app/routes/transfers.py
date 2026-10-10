from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Path, Query
from backend.app.schemas.optimization import TransferCard, ApprovalRequest
from backend.app.schemas.time_to_surge import TimeToSurgeResponse
from backend.app.services.time_to_surge import time_to_surge_service
from backend.app.services.optimizer import optimizer_service
from backend.app.routes.optimize import runs_cache

router = APIRouter(tags=["Transfers & Workflow"])

@router.post("/transfers/{transfer_id}/approve", response_model=TransferCard)
def approve_transfer(
    transfer_id: str = Path(..., description="ID of transfer recommendation to approve"),
    request: ApprovalRequest = ApprovalRequest()
):
    """
    Approve an OR-Tools bus transfer recommendation.
    Records operator decision & timestamp without physically generating extra buses.
    """
    for run_id, run_data in runs_cache.items():
        for t in run_data.get("transfers", []):
            if t["id"] == transfer_id:
                t["approval_status"] = "APPROVED"
                t["approved_at"] = datetime.now(timezone.utc).isoformat()
                t["approved_by"] = request.operator_id
                return TransferCard(**t)

    fresh = optimizer_service.solve(scenario_name="high_peak", demand_multiplier=1.5)
    if fresh["transfers"]:
        t = fresh["transfers"][0]
        t["id"] = transfer_id
        t["approval_status"] = "APPROVED"
        t["approved_at"] = datetime.now(timezone.utc).isoformat()
        t["approved_by"] = request.operator_id
        return TransferCard(**t)

    raise HTTPException(status_code=404, detail=f"Transfer recommendation '{transfer_id}' not found.")

@router.post("/transfers/{transfer_id}/reject", response_model=TransferCard)
def reject_transfer(
    transfer_id: str = Path(..., description="ID of transfer recommendation to reject"),
    request: ApprovalRequest = ApprovalRequest()
):
    """
    Reject an OR-Tools bus transfer recommendation.
    """
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
