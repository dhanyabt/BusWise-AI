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

class ForecastResponse(BaseModel):
    scenario: str
    demand_multiplier: float
    stops_forecast: List[StopForecast]
    evaluation_mae: float = Field(..., description="Chronological train/test split MAE evaluated on synthetic historical dataset")
    model_type: str = Field(default="Feature-Engineered Random Forest Regressor")
    is_demo_data: bool = True
