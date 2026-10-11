from fastapi import APIRouter, Query
from backend.app.schemas.forecasts import ForecastResponse
from backend.app.services.forecasting import forecasting_service

router = APIRouter(tags=["Forecasts"])

from typing import Optional

@router.get("/forecasts", response_model=ForecastResponse)
def get_demand_forecasts(
    scenario: str = Query(default="baseline", description="Scenario name: baseline, high_peak, low_demand"),
    multiplier: float = Query(default=1.0, ge=0.1, le=3.0, description="Demand scaling multiplier"),
    event_id: Optional[str] = Query(default=None, description="Event ID for ground observation lookup"),
    location: Optional[str] = Query(default=None, description="Location name for weather lookup"),
    use_experimental_weather: bool = Query(default=False, description="Enable experimental Open-Meteo weather adjustment factor")
):
    """
    Get 2-hour demand forecast across all stops in 15-minute intervals.
    Includes chronological ML model evaluation MAE, ground observations, and optional live weather.
    """
    res = forecasting_service.get_forecasts(
        scenario_name=scenario,
        multiplier=multiplier,
        event_id=event_id,
        location=location,
        use_experimental_weather=use_experimental_weather
    )
    return ForecastResponse(**res)
