import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_routes_search_location():
    res = client.get("/api/routes/search?q=CMBT")
    assert res.status_code == 200
    data = res.json()
    assert "query" in data
    assert data["query"] == "CMBT"
    assert "results" in data
    assert len(data["results"]) > 0
    first = data["results"][0]
    assert "lat" in first
    assert "lng" in first

def test_routes_calculate_fallback_or_service():
    payload = {
        "origin_lat": 13.0694,
        "origin_lng": 80.1948,
        "destination_lat": 13.0827,
        "destination_lng": 80.2707,
        "origin_name": "CMBT Koyambedu",
        "destination_name": "Chennai Central Rail"
    }
    res = client.post("/api/routes/calculate", json=payload)
    # When ORS key is set, returns 200; when missing, returns 503 Service Unavailable with descriptive message
    assert res.status_code in (200, 503)
    data = res.json()
    if res.status_code == 200:
        assert data["distance_km"] > 0
        assert data["duration_minutes"] > 0
        assert len(data["geometry"]) >= 2
    else:
        assert "detail" in data

def test_tracking_status():
    res = client.get("/api/tracking/status")
    assert res.status_code == 200
    data = res.json()
    assert "is_configured" in data
    assert "connection_status" in data
    assert "total_registered_fleet" in data
    assert data["total_registered_fleet"] >= 16

def test_tracking_vehicles_role_access():
    # Passenger View
    res_pass = client.get("/api/tracking/vehicles")
    assert res_pass.status_code == 200
    data_pass = res_pass.json()
    assert "vehicles" in data_pass
    assert len(data_pass["vehicles"]) >= 16
    assert data_pass["vehicles"][0]["battery_level"] is None

    # Officer View
    res_off = client.get("/api/tracking/vehicles", headers={"X-User-Role": "OFFICER"})
    assert res_off.status_code == 200
    data_off = res_off.json()
    assert len(data_off["vehicles"]) >= 16
