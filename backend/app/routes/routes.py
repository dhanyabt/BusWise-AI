from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.routing import RouteRequest, RouteResponse, LocationSearchResponse
from backend.app.services.routing import routing_service

router = APIRouter(prefix="/routes", tags=["Routes"])

@router.post("/calculate", response_model=RouteResponse)
def calculate_route(request: RouteRequest):
    """
    Calculate real road route between origin and destination using OpenRouteService.
    Credentials remain safe on the backend.
    """
    try:
        return routing_service.calculate_route(request)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate route: {str(e)}")

@router.get("/search", response_model=LocationSearchResponse)
def search_locations(
    q: str = Query(..., min_length=2, description="Location search query across Tamil Nadu"),
    limit: int = Query(8, ge=1, le=20)
):
    """
    Search for places, bus stops, and landmarks in Tamil Nadu.
    """
    try:
        return routing_service.search_locations(query=q)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location search failed: {str(e)}")
