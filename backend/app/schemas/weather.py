"""
Pydantic schemas for Open-Meteo Live Weather Integration.
"""

from pydantic import BaseModel
from typing import Optional, List


class HourlyWeather(BaseModel):
    time: str
    temperature_c: float
    precipitation_probability: Optional[int] = 0
    rain_mm: Optional[float] = 0.0
    weather_condition: str


class WeatherResponse(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    current_temperature_c: Optional[float] = None
    apparent_temperature_c: Optional[float] = None
    precipitation_mm: Optional[float] = None
    relative_humidity_pct: Optional[int] = None
    wind_speed_kmh: Optional[float] = None
    weather_condition: str
    weather_code: Optional[int] = None
    forecast_time: Optional[str] = None
    last_updated_at: str
    status: str  # "live", "stale", "unavailable"
    provider: str = "Open-Meteo API (https://open-meteo.com)"
    is_experimental_forecast_input: bool = False
    hourly_forecast: Optional[List[HourlyWeather]] = []
    message: Optional[str] = None
