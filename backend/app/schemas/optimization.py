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
    weather_severity: Optional[str] = Field(default="Normal", description="Normal, Moderate, Severe")
    traffic_delay_mins: Optional[int] = Field(default=0, description="Additional traffic delay in minutes (0-60)")
    road_closure: Optional[str] = Field(default="NONE", description="Road closure pair e.g. STOP-001_STOP-004 or NONE")
    bus_delay_id: Optional[str] = Field(default=None, description="Specific delayed bus ID e.g. BUS-005")
    bus_delay_mins: Optional[int] = Field(default=0, description="Bus delay in minutes")

class TransferCard(BaseModel):
    id: str
    run_id: str = Field(default="run-demo-001")
    origin_stop_id: str
    origin_stop_name: str
    destination_stop_id: str
    destination_stop_name: str
    bus_id: Optional[str] = Field(default="BUS-014", description="Assigned bus ID")
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
    priority: str = Field(default="HIGH", description="CRITICAL, HIGH, MEDIUM, LOW")
    travel_time_mins: int = Field(default=15, description="Travel duration in minutes")
    is_feasible: bool = Field(default=True, description="Whether transfer is feasible under current road/traffic constraints")
    infeasibility_reason: Optional[str] = Field(default=None, description="Explanation if transfer is blocked by road closure or delay")

    # Operator Approval Workflow States
    approval_status: str = Field(default="RECOMMENDED", description="RECOMMENDED, APPROVED, TRAVELING, ARRIVED, REJECTED, CANCELLED")
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
