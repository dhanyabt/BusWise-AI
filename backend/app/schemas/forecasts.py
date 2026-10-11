from pydantic import BaseModel, Field
from typing import List

class ForecastItem(BaseModel):
    interval_index: int = Field(..., ge=0, le=7)
    time_label: str = Field(..., json_schema_extra={"example": "T+0m (19:15)"})
    arrivals: int = Field(..., ge=0)
    risk_level: str = Field(default="LOW", json_schema_extra={"example": "HIGH"})

class StopForecast(BaseModel):
    stop_id: str
    stop_name: str
    initial_queue: int
    intervals: List[ForecastItem]
    total_2h_arrivals: int
    peak_interval_index: int

from typing import List, Optional, Dict, Any

class ForecastResponse(BaseModel):
    scenario: str
    demand_multiplier: float
    stops_forecast: List[StopForecast]
    evaluation_mae: float = Field(..., description="Chronological train/test split MAE evaluated on synthetic historical dataset")
    model_type: str = Field(default="Feature-Engineered Random Forest Regressor")
    is_demo_data: bool = True
    latest_manual_observation: Optional[Dict[str, Any]] = None
    live_weather: Optional[Dict[str, Any]] = None
    weather_forecast_notes: Optional[str] = None
    is_experimental_weather_applied: Optional[bool] = False
