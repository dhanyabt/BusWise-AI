from pydantic import BaseModel, Field
from typing import List, Optional

class TimeToSurgeItem(BaseModel):
    stop_id: str
    stop_name: str
    current_queue: int
    predicted_surge_interval: Optional[int] = Field(None, description="Interval index where queue crosses threshold (e.g. 150 pax)")
    predicted_surge_time_label: str = Field(..., description="e.g. T+30m (30 minutes from now)")
    estimated_time_remaining_minutes: int = Field(..., description="Minutes remaining until surge threshold crossed")
    latest_feasible_dispatch_interval: Optional[int] = Field(None, description="Latest interval to dispatch bus before surge")
    latest_feasible_dispatch_time_label: str = Field(..., description="e.g. T+15m")
    risk_level: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    available_response_options: List[str]
    confidence_score: float = Field(default=0.88, description="Forecast model confidence metric")
    data_freshness: str = Field(default="Live Synced", description="Data freshness indicator")
    has_sufficient_data: bool = True

class TimeToSurgeResponse(BaseModel):
    scenario: str
    threshold_queue: int = 150
    stops_surge: List[TimeToSurgeItem]
    is_demo_data: bool = True
