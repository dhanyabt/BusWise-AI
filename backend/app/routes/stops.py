from fastapi import APIRouter
from backend.app.schemas.stops import BusStopResponse, BusStop
from backend.app.services.database import db_service

router = APIRouter(tags=["Stops"])

@router.get("/stops", response_model=BusStopResponse)
def get_stops():
    """
    Get all festival bus stops.
    """
    raw_stops = db_service.get_stops()
    stops_list = [BusStop(**s) for s in raw_stops]
    return BusStopResponse(
        stops=stops_list,
        total_stops=len(stops_list),
        is_demo_data=not db_service.is_connected
    )
