import logging
import httpx
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from backend.app.config import settings
from backend.app.services.database import db_service
from backend.app.schemas.routing import (
    RouteResponse,
    RouteStep,
    LocationSearchResponse,
    LocationSearchItem,
)

logger = logging.getLogger(__name__)

# Key Tamil Nadu Transit Coordinates (Fallback focus points and presets)
TAMIL_NADU_PRESETS = [
    {"id": "STOP-001", "name": "CMBT Koyambedu", "display_name": "CMBT Koyambedu Metropolitan Bus Terminus, Chennai, Tamil Nadu", "lat": 13.0694, "lng": 80.1948, "type": "bus_station"},
    {"id": "STOP-002", "name": "Mylapore Temple Rd", "display_name": "Mylapore Kapaleeshwarar Temple Precinct, Chennai, Tamil Nadu", "lat": 13.0334, "lng": 80.2699, "type": "cultural"},
    {"id": "STOP-003", "name": "Chennai Central Rail", "display_name": "Chennai Central Railway Station, Chennai, Tamil Nadu", "lat": 13.0827, "lng": 80.2707, "type": "railway_station"},
    {"id": "STOP-004", "name": "T. Nagar Market Rd", "display_name": "Pondy Bazaar, T. Nagar Commercial Feeder Hub, Chennai, Tamil Nadu", "lat": 13.0418, "lng": 80.2341, "type": "commercial"},
    {"id": "TN-TBM", "name": "Tambaram Sanatorium", "display_name": "Tambaram Sanatorium Bus Stand, Chengalpattu / Chennai, Tamil Nadu", "lat": 12.9249, "lng": 80.1200, "type": "bus_station"},
    {"id": "TN-MDU", "name": "Madurai Mattuthavani", "display_name": "Madurai MGR Bus Stand (Mattuthavani), Madurai, Tamil Nadu", "lat": 9.9328, "lng": 78.1561, "type": "bus_station"},
    {"id": "TN-CBE", "name": "Coimbatore Gandhipuram", "display_name": "Gandhipuram Central Bus Stand, Coimbatore, Tamil Nadu", "lat": 11.0168, "lng": 76.9658, "type": "bus_station"},
    {"id": "TN-TRY", "name": "Tiruchirappalli Central", "display_name": "Central Bus Stand, Tiruchirappalli, Tamil Nadu", "lat": 10.7905, "lng": 78.6900, "type": "bus_station"},
    {"id": "TN-SLM", "name": "Salem New Bus Stand", "display_name": "New Bus Terminus, Salem, Tamil Nadu", "lat": 11.6643, "lng": 78.1460, "type": "bus_station"},
    {"id": "TN-TNV", "name": "Tirunelveli New Bus Stand", "display_name": "Vellakkal New Bus Stand, Tirunelveli, Tamil Nadu", "lat": 8.7139, "lng": 77.7567, "type": "bus_station"},
]

class RoutingService:
    def __init__(self):
        self.ors_api_url = "https://api.openrouteservice.org"

    def get_api_key(self) -> str:
        key = settings.OPENROUTESERVICE_API_KEY
        if not key or "your-openrouteservice" in key or key.strip() == "":
            return ""
        return key.strip()

    def calculate_route(
        self,
        request: RouteRequest
    ) -> RouteResponse:
        """
        Calculate actual road route using OpenRouteService API.
        Never returns fake distances or hardcoded fallback lines when request fails.
        """
        try:
            dest_lat, dest_lng = request.get_destination_coords()
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        origin_lat = request.origin_lat
        origin_lng = request.origin_lng
        origin_name = request.origin_name
        dest_name = request.dest_name or request.destination_name
        profile = request.profile or "driving-car"
        api_key = self.get_api_key()
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenRouteService API key not configured on backend. Set OPENROUTESERVICE_API_KEY in backend environment (.env).",
            )

        url = f"{self.ors_api_url}/v2/directions/{profile}/geojson"
        headers = {
            "Authorization": api_key,
            "Content-Type": "application/json",
            "User-Agent": "BusWise-AI-Backend/1.0",
        }
        # Note: OpenRouteService expects coordinates as [longitude, latitude]
        body = {
            "coordinates": [
                [origin_lng, origin_lat],
                [dest_lng, dest_lat],
            ],
            "instructions": True,
            "preference": "recommended",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, json=body, headers=headers)
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="OpenRouteService API request timed out. Please check server network connection.",
            )
        except Exception as e:
            logger.error(f"Error reaching OpenRouteService: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to connect to OpenRouteService API: {e}",
            )

        if resp.status_code == 401 or resp.status_code == 403:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OpenRouteService API authentication failed. Please check your OPENROUTESERVICE_API_KEY.",
            )
        elif resp.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OpenRouteService rate limit or quota exceeded. Please try again later.",
            )
        elif resp.status_code >= 400:
            err_json = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            err_msg = err_json.get("error", {}).get("message") or f"OpenRouteService error HTTP {resp.status_code}"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not calculate road route: {err_msg}",
            )

        geojson_data = resp.json()
        features = geojson_data.get("features", [])
        if not features:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No routing path found between the specified coordinates.",
            )

        primary_feature = features[0]
        properties = primary_feature.get("properties", {})
        geometry = primary_feature.get("geometry", {})
        
        summary_info = properties.get("summary", {})
        distance_meters = summary_info.get("distance", 0.0)
        duration_seconds = summary_info.get("duration", 0.0)

        # Convert GeoJSON coordinates [lng, lat] -> Leaflet coordinates [lat, lng]
        raw_coords = geometry.get("coordinates", [])
        leaflet_coords = [[pt[1], pt[0]] for pt in raw_coords]

        # Extract turn-by-turn steps
        segments = properties.get("segments", [])
        steps_list: List[RouteStep] = []
        if segments:
            for seg in segments:
                for st in seg.get("steps", []):
                    steps_list.append(
                        RouteStep(
                            instruction=st.get("instruction", ""),
                            distance_m=st.get("distance", 0.0),
                            duration_s=st.get("duration", 0.0),
                        )
                    )

        dist_km = round(distance_meters / 1000.0, 2)
        dur_mins = round(duration_seconds / 60.0, 1)

        bbox = primary_feature.get("bbox")
        bounds_leaflet = None
        if bbox and len(bbox) == 4:
            # bbox is [min_lng, min_lat, max_lng, max_lat] -> [[min_lat, min_lng], [max_lat, max_lng]]
            bounds_leaflet = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]]

        return RouteResponse(
            success=True,
            provider="OpenRouteService Driving-Car Engine",
            distance_km=dist_km,
            duration_minutes=dur_mins,
            coordinates=leaflet_coords,
            steps=steps_list,
            summary=f"{dist_km} km ({dur_mins} mins via ORS road network)",
            origin_name=origin_name,
            dest_name=dest_name,
            bounds=bounds_leaflet,
        )

    def search_locations(self, query: str) -> LocationSearchResponse:
        """
        Search for addresses or landmarks throughout Tamil Nadu.
        Checks registered bus stops, pre-indexed TN hubs, OpenRouteService Geocoder, and Nominatim.
        """
        clean_query = query.strip().lower()
        if not clean_query:
            return LocationSearchResponse(query=query, results=[], total=0, provider="None")

        matched_results: List[LocationSearchItem] = []

        # 1. Match registered bus stops from database
        db_stops = db_service.get_stops()
        for stop in db_stops:
            if clean_query in stop["name"].lower() or clean_query in stop.get("description", "").lower():
                matched_results.append(
                    LocationSearchItem(
                        id=stop["id"],
                        name=stop["name"],
                        display_name=f"{stop['name']} (Registered Stop, Queue: {stop.get('initial_queue', 0)})",
                        lat=stop["location_lat"],
                        lng=stop["location_lng"],
                        type="bus_stop",
                    )
                )

        # 2. Match Tamil Nadu major presets
        for preset in TAMIL_NADU_PRESETS:
            if any(r.id == preset["id"] for r in matched_results):
                continue
            if clean_query in preset["name"].lower() or clean_query in preset["display_name"].lower():
                matched_results.append(
                    LocationSearchItem(
                        id=preset["id"],
                        name=preset["name"],
                        display_name=preset["display_name"],
                        lat=preset["lat"],
                        lng=preset["lng"],
                        type=preset["type"],
                    )
                )

        # 3. OpenRouteService Geocoding Search if key is available
        api_key = self.get_api_key()
        provider_used = "Local TN Index"

        if api_key and len(matched_results) < 5:
            try:
                url = f"{self.ors_api_url}/geocode/search"
                params = {
                    "api_key": api_key,
                    "text": query,
                    "boundary.country": "IND",
                    "focus.point.lat": 13.0827,
                    "focus.point.lon": 80.2707,
                    "size": 5,
                }
                with httpx.Client(timeout=4.0) as client:
                    resp = client.get(url, params=params)
                    if resp.status_code == 200:
                        geo_json = resp.json()
                        provider_used = "OpenRouteService Pelias Geocoder"
                        for feat in geo_json.get("features", []):
                            coords = feat.get("geometry", {}).get("coordinates", [])
                            props = feat.get("properties", {})
                            if len(coords) >= 2:
                                item_id = f"ors-{props.get('id', coords[0])}"
                                if not any(r.id == item_id for r in matched_results):
                                    matched_results.append(
                                        LocationSearchItem(
                                            id=item_id,
                                            name=props.get("name") or props.get("label", query),
                                            display_name=props.get("label", query),
                                            lat=coords[1],
                                            lng=coords[0],
                                            type="location",
                                        )
                                    )
            except Exception as e:
                logger.warning(f"ORS geocoding error: {e}")

        # 4. OpenStreetMap Nominatim Search fallback if results are still sparse
        if len(matched_results) < 5:
            try:
                nom_url = "https://nominatim.openstreetmap.org/search"
                nom_params = {
                    "q": f"{query}, Tamil Nadu, India",
                    "format": "json",
                    "countrycodes": "in",
                    "limit": 5,
                }
                headers = {"User-Agent": "BusWise-AI-TamilNadu-Transit/1.0"}
                with httpx.Client(timeout=4.0) as client:
                    resp = client.get(nom_url, params=nom_params, headers=headers)
                    if resp.status_code == 200:
                        nom_data = resp.json()
                        if not provider_used or provider_used == "Local TN Index":
                            provider_used = "OpenStreetMap Nominatim"
                        for item in nom_data:
                            item_id = f"osm-{item.get('place_id')}"
                            if not any(r.id == item_id for r in matched_results):
                                matched_results.append(
                                    LocationSearchItem(
                                        id=item_id,
                                        name=item.get("display_name", "").split(",")[0],
                                        display_name=item.get("display_name", ""),
                                        lat=float(item["lat"]),
                                        lng=float(item["lon"]),
                                        type=item.get("type", "location"),
                                    )
                                )
            except Exception as e:
                logger.warning(f"Nominatim search error: {e}")

        return LocationSearchResponse(
            query=query,
            results=matched_results[:10],
            total=len(matched_results[:10]),
            provider=provider_used,
        )

routing_service = RoutingService()
