from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Header
from backend.app.schemas.optimization import OptimizationRequest, OptimizationResponse, TransferCard
from backend.app.services.optimizer import optimizer_service
from backend.app.services.database import db_service
from backend.app.routes.auth import verify_role_permission

router = APIRouter(tags=["Optimization"])

# In-memory storage for optimization runs
runs_cache: dict[str, dict] = {}

@router.post("/optimize", response_model=OptimizationResponse)
def run_optimization(
    request: OptimizationRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Run Google OR-Tools fixed-fleet redistribution solver.
    Returns optimal bus transfer recommendations and stop queue timelines.
    Enforces that only Transport Officers and Police/Safety personnel can run fleet optimization.
    """
    verify_role_permission(authorization, ["OFFICER", "POLICE"])
    w_queue = request.weights.weight_queue if request.weights else 10.0
    w_unmet = request.weights.weight_unmet if request.weights else 100.0
    w_transfer = request.weights.weight_transfer if request.weights else 5.0

    result = optimizer_service.solve(
        scenario_name=request.scenario_name,
        demand_multiplier=request.demand_multiplier,
        min_service_level_override=request.min_service_level,
        bus_capacity=request.bus_capacity,
        weight_queue=w_queue,
        weight_unmet=w_unmet,
        weight_transfer=w_transfer,
    )

    run_id = result["run_id"]
    runs_cache[run_id] = result

    # Persist to Supabase if connected
    if db_service.is_connected:
        db_run = {
            "id": run_id,
            "status": result["solver_status"],
            "solver_name": result["solver_name"],
            "scenario_name": result["scenario_name"],
            "total_fleet_size": result["total_fleet_size"],
            "total_unmet_demand": result["total_unmet_demand"],
            "total_wait_time_min": result["total_wait_passenger_intervals"] * 15.0,
            "solve_duration_ms": result["solve_duration_ms"],
        }
        db_transfers = [
            {
                "origin_stop_id": t["origin_stop_id"],
                "destination_stop_id": t["destination_stop_id"],
                "bus_count": t["bus_count"],
                "dispatch_interval": t["dispatch_interval"],
                "arrival_interval": t["arrival_interval"],
                "destination_benefit_explanation": t["destination_benefit_explanation"],
                "origin_impact_explanation": t["origin_impact_explanation"],
            }
            for t in result["transfers"]
        ]
        db_service.save_optimization_run(db_run, db_transfers)

    return OptimizationResponse(**result)

@router.get("/optimization-runs/{run_id}", response_model=OptimizationResponse)
def get_optimization_run(run_id: str = Path(...)):
    """
    Get results of a specific optimization run by ID.
    """
    if run_id in runs_cache:
        return OptimizationResponse(**runs_cache[run_id])
    
    # Fallback to fresh run if not found
    fresh = optimizer_service.solve()
    fresh["run_id"] = run_id
    runs_cache[run_id] = fresh
    return OptimizationResponse(**fresh)

@router.get("/optimization-runs/{run_id}/transfers", response_model=list[TransferCard])
def get_optimization_transfers(run_id: str = Path(...)):
    """
    Get recommended transfer cards for a specific optimization run.
    """
    if run_id in runs_cache:
        transfers = runs_cache[run_id]["transfers"]
        return [TransferCard(**t) for t in transfers]

    fresh = optimizer_service.solve()
    return [TransferCard(**t) for t in fresh["transfers"]]
