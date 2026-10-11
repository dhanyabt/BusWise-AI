"""
Unit and Integration Tests for Live Weather (Open-Meteo) and Manual Crowd Observation Reporting.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.user_db import user_db

client = TestClient(app)


def get_token(email: str = "eventmanager@buswise.ai", password: str = "demo123"):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["token"]


def get_passenger_token():
    resp = client.post("/api/auth/login", json={"email": "passenger@buswise.ai", "password": "demo123"})
    assert resp.status_code == 200
    return resp.json()["token"]


# ==================== ITEM K: LIVE WEATHER TESTS ====================

def test_weather_current_default():
    """Test retrieving current weather for default Tamil Nadu location."""
    response = client.get("/api/weather/current")
    assert response.status_code == 200
    data = response.json()
    assert "location_name" in data
    assert "status" in data
    assert data["status"] in ["live", "stale", "unavailable"]
    assert "provider" in data
    assert "Open-Meteo" in data["provider"]
    assert data["is_experimental_forecast_input"] is False


def test_weather_current_named_location():
    """Test retrieving weather by Tamil Nadu location name (e.g., Madurai)."""
    response = client.get("/api/weather/current?location_name=madurai")
    assert response.status_code == 200
    data = response.json()
    assert "Madurai" in data["location_name"]
    assert data["latitude"] > 0
    assert data["longitude"] > 0


def test_weather_supported_locations():
    """Test fetching all supported TN event hub weather summaries."""
    response = client.get("/api/weather/supported-locations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    names = [loc["location_name"] for loc in data]
    assert any("Madurai" in n for n in names)
    assert any("Chennai" in n for n in names)


# ==================== ITEM L: MANUAL CROWD OBSERVATION TESTS ====================

def test_passenger_cannot_create_observation():
    """Verify that PASSENGER role is forbidden from submitting crowd observations (HTTP 403)."""
    token = get_passenger_token()
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "event_id": "EVT-TEST-01",
        "location": "Madurai Central Bus Stand",
        "observed_count": 1500,
        "observed_at": "2026-10-11T10:00:00Z"
    }
    response = client.post("/api/events/observations", json=payload, headers=headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_event_manager_create_observation():
    """Verify Event Manager can submit valid crowd observation and persist in DB."""
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "event_id": "EVT-TEST-02",
        "occurrence_id": "OCC-TEST-02",
        "location": "Thanjavur Bus Stand",
        "observed_count": 3200,
        "observed_at": "2026-10-11T10:30:00Z",
        "notes": "Gate 2 surge observed by ground patrol.",
        "source": "Gate Counter 2"
    }
    response = client.post("/api/events/observations", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["event_id"] == "EVT-TEST-02"
    assert data["observed_count"] == 3200
    assert data["reported_by"] == "eventmanager@buswise.ai"
    assert data["is_manually_reported"] is True
    assert "id" in data


def test_observation_negative_count_validation():
    """Verify negative crowd count is rejected with HTTP 400."""
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "event_id": "EVT-TEST-03",
        "location": "Palani Stand",
        "observed_count": -500,
        "observed_at": "2026-10-11T11:00:00Z"
    }
    response = client.post("/api/events/observations", json=payload, headers=headers)
    assert response.status_code == 422 or response.status_code == 400


def test_observation_edit_and_audit_trail():
    """Verify editing observation logs an audit trail with previous values."""
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create
    create_res = client.post("/api/events/observations", json={
        "event_id": "EVT-TEST-AUDIT",
        "location": "Tiruchendur Temple Road",
        "observed_count": 5000,
        "observed_at": "2026-10-11T12:00:00Z"
    }, headers=headers)
    assert create_res.status_code == 201
    obs_id = create_res.json()["id"]

    # 2. Update/Correct
    update_res = client.put(f"/api/events/observations/{obs_id}", json={
        "observed_count": 5500,
        "notes": "Recounted with secondary gate log."
    }, headers=headers)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["observed_count"] == 5500
    assert updated_data["edited_by"] == "eventmanager@buswise.ai"
    assert updated_data["edited_at"] is not None
    assert updated_data["audit_trail"] is not None
    assert len(updated_data["audit_trail"]) == 1
    assert updated_data["audit_trail"][0]["previous_values"]["observed_count"] == 5000


def test_latest_event_observation_endpoint():
    """Test retrieving latest manual crowd observation for an event."""
    response = client.get("/api/events/EVT-TEST-AUDIT/latest-observation")
    assert response.status_code == 200
    data = response.json()
    assert data["has_observation"] is True
    assert data["label"] == "Manually reported"
    assert data["observation"]["observed_count"] == 5500


def test_forecast_includes_ground_observation_and_weather():
    """Verify forecast endpoint returns ground observation and weather disclaimer."""
    response = client.get("/api/forecasts?event_id=EVT-TEST-AUDIT&use_experimental_weather=true")
    assert response.status_code == 200
    data = response.json()
    assert "latest_manual_observation" in data
    assert data["latest_manual_observation"]["observed_count"] == 5500
    assert "live_weather" in data
    assert "weather_forecast_notes" in data
