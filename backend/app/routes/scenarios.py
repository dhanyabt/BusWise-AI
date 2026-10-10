from fastapi import APIRouter
from backend.app.schemas.scenarios import ScenarioInput, ScenarioResponse

router = APIRouter(tags=["Scenarios"])

# Global scenario state for demo session
current_scenario = {
    "scenario_name": "baseline",
    "demand_multiplier": 1.0,
    "peak_shift_interval": 0,
    "min_service_override": 1
}

@router.post("/scenarios", response_model=ScenarioResponse)
def update_scenario(input_data: ScenarioInput):
    """
    Update active simulation scenario parameters.
    """
    global current_scenario
    current_scenario["scenario_name"] = input_data.scenario_name
    current_scenario["demand_multiplier"] = input_data.demand_multiplier
    current_scenario["peak_shift_interval"] = input_data.peak_shift_interval
    current_scenario["min_service_override"] = input_data.min_service_override

    return ScenarioResponse(
        scenario_name=input_data.scenario_name,
        demand_multiplier=input_data.demand_multiplier,
        peak_shift_interval=input_data.peak_shift_interval,
        min_service_override=input_data.min_service_override,
        active_parameters=current_scenario,
        message=f"Scenario '{input_data.scenario_name}' applied successfully."
    )
