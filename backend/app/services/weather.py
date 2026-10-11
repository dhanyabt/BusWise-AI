"""
BusWise AI - Open-Meteo Live Weather Integration Service
Retrieves real-time weather and forecasts for supported Tamil Nadu event locations
using Open-Meteo API (https://open-meteo.com).
"""

import urllib.request
import urllib.parse
import json
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Validated geographic coordinates for Tamil Nadu event hubs
TN_LOCATION_COORDINATES: Dict[str, Dict[str, Any]] = {
    "madurai": {"name": "Madurai (Meenakshi Sundareswarar / Chithirai)", "lat": 9.9252, "lng": 78.1198},
    "thanjavur": {"name": "Thanjavur (Brihadishvara / Periya Kovil)", "lat": 10.7870, "lng": 79.1378},
    "tiruchendur": {"name": "Tiruchendur (Subramanya Swamy Temple / Kanda Sashti)", "lat": 8.4836, "lng": 78.1207},
    "chennai": {"name": "Chennai Central / Koyambedu Hub", "lat": 13.0827, "lng": 80.2707},
    "coimbatore": {"name": "Coimbatore (Gandhipuram Hub)", "lat": 11.0168, "lng": 76.9558},
    "salem": {"name": "Salem (New Bus Stand Hub)", "lat": 11.6643, "lng": 78.1460},
    "tiruchirappalli": {"name": "Tiruchirappalli / Samayapuram", "lat": 10.7905, "lng": 78.7047},
    "palani": {"name": "Palani (Dhandayuthapani Swamy Temple / Thaipusam)", "lat": 10.4500, "lng": 77.5200},
    "velankanni": {"name": "Velankanni (Annai Velankanni Shrine)", "lat": 10.6800, "lng": 79.8300},
    "kanchipuram": {"name": "Kanchipuram (Varadharaja Perumal Temple)", "lat": 12.8342, "lng": 79.7036},
    "chidambaram": {"name": "Chidambaram (Nataraja Temple / Natyanjali)", "lat": 11.3992, "lng": 79.6936},
    "tiruvannamalai": {"name": "Tiruvannamalai (Annamalaiyar Temple / Deepam)", "lat": 12.2253, "lng": 79.0747},
    "rameswaram": {"name": "Rameswaram (Ramanathaswamy Temple)", "lat": 9.2876, "lng": 79.3129},
    "nagapattinam": {"name": "Nagapattinam Bus Hub", "lat": 10.7672, "lng": 79.8449},
    "tirunelveli": {"name": "Tirunelveli (Nellaiyappar Temple)", "lat": 8.7139, "lng": 77.7567},
    "erode": {"name": "Erode Bus Stand Hub", "lat": 11.3410, "lng": 77.7172},
}

# Open-Meteo WMO Weather Code Translation
WMO_WEATHER_CODES: Dict[int, str] = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    56: "Light Freezing Drizzle",
    57: "Dense Freezing Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    66: "Light Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Slight Snow Fall",
    73: "Moderate Snow Fall",
    75: "Heavy Snow Fall",
    77: "Snow Grains",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    85: "Slight Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail"
}

class WeatherService:
    def __init__(self, cache_ttl_seconds: int = 600):
        self.cache_ttl = cache_ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_cache_key(self, lat: float, lng: float) -> str:
        return f"{round(lat, 4)},{round(lng, 4)}"

    def get_weather(self, lat: float, lng: float, location_name: Optional[str] = None) -> Dict[str, Any]:
        """Fetch real-time weather from Open-Meteo REST API with fallback and caching."""
        cache_key = self._get_cache_key(lat, lng)
        now_ts = time.time()

        # Check cache
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            if now_ts - cached["timestamp"] < self.cache_ttl:
                data = cached["data"].copy()
                data["status"] = "live"
                if location_name:
                    data["location_name"] = location_name
                return data

        # Query Open-Meteo API
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lng}"
            f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m"
            f"&hourly=temperature_2m,precipitation_probability,rain,weather_code"
            f"&forecast_days=1&timezone=Asia%2FKolkata"
        )

        try:
            req = urllib.request.Request(url, headers={"User-Agent": "BusWiseAI-TN-Transport/1.0"})
            with urllib.request.urlopen(req, timeout=5.0) as response:
                if response.status == 200:
                    payload = json.loads(response.read().decode('utf-8'))
                    current = payload.get("current", {})
                    hourly = payload.get("hourly", {})

                    weather_code = current.get("weather_code", 0)
                    weather_cond = WMO_WEATHER_CODES.get(weather_code, f"Code {weather_code}")

                    # Hourly forecast items (next 6 hours)
                    hourly_items = []
                    h_times = hourly.get("time", [])
                    h_temps = hourly.get("temperature_2m", [])
                    h_probs = hourly.get("precipitation_probability", [])
                    h_rains = hourly.get("rain", [])
                    h_codes = hourly.get("weather_code", [])

                    for i in range(min(6, len(h_times))):
                        code_i = h_codes[i] if i < len(h_codes) else 0
                        hourly_items.append({
                            "time": h_times[i],
                            "temperature_c": h_temps[i] if i < len(h_temps) else 0.0,
                            "precipitation_probability": h_probs[i] if i < len(h_probs) else 0,
                            "rain_mm": h_rains[i] if i < len(h_rains) else 0.0,
                            "weather_condition": WMO_WEATHER_CODES.get(code_i, "Clear")
                        })

                    last_updated = datetime.now(timezone.utc).isoformat()
                    forecast_time = current.get("time", last_updated)

                    resolved_name = location_name or f"Coords ({lat:.2f}, {lng:.2f})"

                    weather_result = {
                        "location_name": resolved_name,
                        "latitude": float(lat),
                        "longitude": float(lng),
                        "current_temperature_c": current.get("temperature_2m"),
                        "apparent_temperature_c": current.get("apparent_temperature"),
                        "precipitation_mm": current.get("precipitation", 0.0),
                        "relative_humidity_pct": current.get("relative_humidity_2m"),
                        "wind_speed_kmh": current.get("wind_speed_10m"),
                        "weather_condition": weather_cond,
                        "weather_code": weather_code,
                        "forecast_time": forecast_time,
                        "last_updated_at": last_updated,
                        "status": "live",
                        "provider": "Open-Meteo API (https://open-meteo.com)",
                        "is_experimental_forecast_input": False,
                        "hourly_forecast": hourly_items,
                        "message": "Live weather retrieved directly from Open-Meteo service."
                    }

                    # Store in cache
                    self._cache[cache_key] = {"timestamp": now_ts, "data": weather_result}
                    return weather_result

        except Exception as e:
            logger.warning(f"Open-Meteo API request failed for ({lat}, {lng}): {e}")

        # If call failed but stale cache exists, return stale
        if cache_key in self._cache:
            stale_data = self._cache[cache_key]["data"].copy()
            stale_data["status"] = "stale"
            stale_data["message"] = "Open-Meteo request failed. Displaying cached weather data."
            if location_name:
                stale_data["location_name"] = location_name
            return stale_data

        # If no cache exists and request failed, return clear UNAVAILABLE status without fabricating numbers
        resolved_name = location_name or f"Location ({lat:.2f}, {lng:.2f})"
        return {
            "location_name": resolved_name,
            "latitude": float(lat),
            "longitude": float(lng),
            "current_temperature_c": None,
            "apparent_temperature_c": None,
            "precipitation_mm": None,
            "relative_humidity_pct": None,
            "wind_speed_kmh": None,
            "weather_condition": "Weather Unavailable",
            "weather_code": None,
            "forecast_time": None,
            "last_updated_at": datetime.now(timezone.utc).isoformat(),
            "status": "unavailable",
            "provider": "Open-Meteo API (https://open-meteo.com)",
            "is_experimental_forecast_input": False,
            "hourly_forecast": [],
            "message": "Live weather API is currently unavailable or unreachable. No fake values generated."
        }

    def get_supported_locations_weather(self) -> List[Dict[str, Any]]:
        """Retrieve weather for all primary Tamil Nadu event hubs."""
        results = []
        for key, loc in TN_LOCATION_COORDINATES.items():
            w = self.get_weather(loc["lat"], loc["lng"], location_name=loc["name"])
            results.append(w)
        return results

    def find_coordinates_by_name(self, name: str) -> Optional[Dict[str, float]]:
        """Find matching Tamil Nadu location coordinates by substring match."""
        name_lower = name.lower()
        for key, loc in TN_LOCATION_COORDINATES.items():
            if key in name_lower or loc["name"].lower() in name_lower:
                return {"lat": loc["lat"], "lng": loc["lng"], "name": loc["name"]}
        # Default Tamil Nadu central fallback if unknown
        return None

weather_service = WeatherService()
