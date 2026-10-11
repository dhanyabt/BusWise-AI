"""
BusWise AI - Live Weather API Endpoints (Open-Meteo Integration)
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from backend.app.services.weather import weather_service, TN_LOCATION_COORDINATES
from backend.app.schemas.weather import WeatherResponse

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=WeatherResponse)
def get_current_weather(
    lat: Optional[float] = Query(None, description="Latitude (e.g., 9.9252)"),
    lng: Optional[float] = Query(None, description="Longitude (e.g., 78.1198)"),
    location_name: Optional[str] = Query(None, description="Location name or key (e.g., madurai, chennai, thanjavur)")
):
    """
    Retrieve real-time live weather and hourly forecast from Open-Meteo API.
    If coordinates are omitted, attempts to resolve by location_name or defaults to Madurai Hub.
    """
    resolved_lat = lat
    resolved_lng = lng
    resolved_name = location_name

    if resolved_lat is None or resolved_lng is None:
        if location_name:
            found = weather_service.find_coordinates_by_name(location_name)
            if found:
                resolved_lat = found["lat"]
                resolved_lng = found["lng"]
                resolved_name = found["name"]

        # Default fallback coordinates: Madurai
        if resolved_lat is None or resolved_lng is None:
            resolved_lat = 9.9252
            resolved_lng = 78.1198
            resolved_name = "Madurai Central Hub"

    weather = weather_service.get_weather(resolved_lat, resolved_lng, location_name=resolved_name)
    return weather


@router.get("/supported-locations")
def get_supported_locations_weather() -> List[Dict[str, Any]]:
    """
    Retrieve live weather summary across all major Tamil Nadu event locations.
    """
    return weather_service.get_supported_locations_weather()


@router.get("/locations")
def get_tn_locations() -> Dict[str, Dict[str, Any]]:
    """
    Return dictionary of validated Tamil Nadu location hub coordinates.
    """
    return TN_LOCATION_COORDINATES
