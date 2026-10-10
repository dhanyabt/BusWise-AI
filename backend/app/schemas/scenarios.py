from pydantic import BaseModel, Field
from typing import Dict, Any

class ScenarioInput(BaseModel):
    scenario_name: str = Field(default="baseline", json_schema_extra={"example": "baseline"})
    demand_multiplier: float = Field(default=1.0, ge=0.1, le=3.0)
    peak_shift_interval: int = Field(default=0, ge=0, le=4)
    min_service_override: int = Field(default=1, ge=0, le=5)

class ScenarioResponse(BaseModel):
    scenario_name: str
    demand_multiplier: float
    peak_shift_interval: int
    min_service_override: int
    active_parameters: Dict[str, Any]
    message: str = "Scenario applied successfully"
    is_demo_data: bool = True
