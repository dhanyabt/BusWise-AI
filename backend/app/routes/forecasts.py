from fastapi import APIRouter, Query
from backend.app.schemas.forecasts import ForecastResponse
from backend.app.services.forecasting import forecasting_service

router = APIRouter(tags=["Forecasts"])

@router.get("/forecasts", response_model=ForecastResponse)
def get_demand_forecasts(
    scenario: str = Query(default="baseline", description="Scenario name: baseline, high_peak, low_demand"),
    multiplier: float = Query(default=1.0, ge=0.1, le=3.0, description="Demand scaling multiplier")
):
    """
    Get 2-hour demand forecast across all stops in 15-minute intervals.
    Includes chronological ML model evaluation MAE.
    """
    res = forecasting_service.get_forecasts(scenario_name=scenario, multiplier=multiplier)
    return ForecastResponse(**res)
