from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class OptimizationWeights(BaseModel):
    weight_queue: float = Field(default=10.0, description="Penalty per queued passenger-interval")
    weight_unmet: float = Field(default=100.0, description="Penalty per unmet demand passenger")
    weight_transfer: float = Field(default=5.0, description="Penalty per bus transfer movement")
    weight_disruption: float = Field(default=2.0, description="Penalty for origin stop service impact")

class OptimizationRequest(BaseModel):
    scenario_name: str = Field(default="baseline")
    demand_multiplier: float = Field(default=1.0)
    min_service_level: int = Field(default=1)
    bus_capacity: int = Field(default=60)
    weights: Optional[OptimizationWeights] = Field(default_factory=OptimizationWeights)

class TransferCard(BaseModel):
    id: str
    run_id: str = Field(default="run-demo-001")
    origin_stop_id: str
    origin_stop_name: str
    destination_stop_id: str
    destination_stop_name: str
    bus_count: int
    dispatch_interval: int
    dispatch_time_label: str
    arrival_interval: int
    arrival_time_label: str
    
    # RippleGuard Explainability & Ledger Fields
    destination_benefit_explanation: str
    origin_impact_explanation: str
    expected_destination_queue_change: int = Field(default=-120, description="Estimated reduction in destination queue (e.g. -120 pax)")
    expected_origin_queue_change: int = Field(default=0, description="Estimated origin queue impact")
    min_service_status: str = Field(default="SATISFIED", description="SATISFIED or VIOLATED")
    fleet_conservation_status: str = Field(default="VERIFIED", description="VERIFIED: 16 buses conserved")
    forecast_scenario: str = Field(default="baseline")
    remaining_unmet_demand: int = Field(default=0)

    # Operator Approval Workflow States
    approval_status: str = Field(default="RECOMMENDED", description="RECOMMENDED, APPROVED, DISPATCHED, COMPLETED, REJECTED, CANCELLED")
    approved_at: Optional[str] = None
    approved_by: Optional[str] = None

class IntervalStopState(BaseModel):
    interval_index: int
    time_label: str
    buses_stationed: int
    buses_departing: int
    buses_arriving: int
    arrivals: int
    passengers_served: int
    ending_queue: int
    unmet_demand: int
    crowd_risk: str  # LOW, MODERATE, HIGH, CRITICAL

class StopTimeline(BaseModel):
    stop_id: str
    stop_name: str
    initial_queue: int
    intervals: List[IntervalStopState]
    total_arrivals: int
    total_served: int
    peak_queue: int
    total_unmet_demand: int

class ConstraintValidation(BaseModel):
    fleet_conservation_passed: bool
    travel_time_feasibility_passed: bool
    capacity_constraint_passed: bool
    min_service_requirement_passed: bool
    non_negative_queues_passed: bool
    details: List[str]

class OptimizationResponse(BaseModel):
    run_id: str
    solver_status: str  # OPTIMAL, FEASIBLE, INFEASIBLE, MODEL_INVALID
    solver_name: str = "Google OR-Tools CBC"
    scenario_name: str
    total_fleet_size: int = 16
    solve_duration_ms: float
    objective_value: float
    total_unmet_demand: int
    total_wait_passenger_intervals: int
    transfers: List[TransferCard]
    stop_timelines: List[StopTimeline]
    constraint_validation: ConstraintValidation
    is_demo_data: bool = True

class ApprovalRequest(BaseModel):
    operator_id: str = Field(default="OP-402", description="Operator identifier")
    notes: Optional[str] = None
