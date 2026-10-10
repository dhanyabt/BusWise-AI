from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_stops_endpoint():
    res = client.get("/api/stops")
    assert res.status_code == 200
    data = res.json()
    assert data["total_stops"] == 4
    assert len(data["stops"]) == 4

def test_get_fleet_endpoint():
    res = client.get("/api/fleet")
    assert res.status_code == 200
    data = res.json()
    assert data["total_buses"] == 16
    assert len(data["buses"]) == 16

def test_get_forecasts_endpoint():
    res = client.get("/api/forecasts?scenario=baseline")
    assert res.status_code == 200
    data = res.json()
    assert data["scenario"] == "baseline"
    assert len(data["stops_forecast"]) == 4

def test_post_optimize_endpoint():
    payload = {
        "scenario_name": "baseline",
        "demand_multiplier": 1.0,
        "min_service_level": 1,
        "bus_capacity": 60,
        "weights": {
            "weight_queue": 10.0,
            "weight_unmet": 100.0,
            "weight_transfer": 5.0
        }
    }
    res = client.post("/api/optimize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_fleet_size"] == 16
    assert "run_id" in data
    assert "transfers" in data
    assert "stop_timelines" in data
