import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.database import db_service
from backend.app.services.optimizer import optimizer_service

client = TestClient(app)

def test_dataset_summary_and_import():
    res_summary = client.get("/api/dataset/summary")
    assert res_summary.status_code == 200
    data_summary = res_summary.json()
    assert "provenance_status" in data_summary
    assert "Dataset-provided" in data_summary["provenance_status"]

    res_import = client.post("/api/dataset/import")
    assert res_import.status_code == 200
    data_import = res_import.json()
    assert data_import["status"] == "success"
    assert data_import["total_rows_imported"] == 1230

def test_dynamic_fleet_crud():
    # 1. Get initial fleet summary
    res = client.get("/api/fleet")
    assert res.status_code == 200
    initial_summary = res.json()
    initial_count = initial_summary["registered_fleet"]

    # 2. Add new bus with unique bus number
    unique_bus_num = f"BW-TEST-{uuid.uuid4().hex[:4].upper()}"
    bus_payload = {
        "bus_number": unique_bus_num,
        "capacity": 75,
        "status": "AVAILABLE",
        "initial_stop_id": "STOP-001"
    }
    res_add = client.post("/api/fleet", json=bus_payload, headers={"X-User-Role": "OFFICER"})
    assert res_add.status_code == 200
    new_bus = res_add.json()
    assert new_bus["bus_number"] == unique_bus_num

    # 3. Verify fleet count increased
    res_after = client.get("/api/fleet")
    summary_after = res_after.json()
    assert summary_after["registered_fleet"] == initial_count + 1

    # 4. Deactivate bus
    res_deact = client.patch(f"/api/fleet/{new_bus['id']}/status?status=DEACTIVATED", headers={"X-User-Role": "OFFICER"})
    assert res_deact.status_code == 200
    assert res_deact.json()["status"] == "DEACTIVATED"

def test_events_api():
    res_events = client.get("/api/events")
    assert res_events.status_code == 200
    events_data = res_events.json()
    assert "total_occurrences" in events_data
    assert "events" in events_data

    evt_payload = {
        "event_name": f"Test Festival {uuid.uuid4().hex[:4]}",
        "event_type": "Cultural & State Festival",
        "district": "Madurai",
        "city_or_town": "Madurai",
        "event_date": "2026-01-14",
        "expected_attendance": 250000
    }
    res_create = client.post("/api/events", json=evt_payload, headers={"X-User-Role": "EVENT_MANAGER"})
    assert res_create.status_code == 200
    assert res_create.json()["status"] == "success"

def test_user_role_management():
    # Public registration forced to PASSENGER if requesting elevated role without approval
    unique_email = f"attacker-{uuid.uuid4().hex[:6]}@test.com"
    reg_payload = {
        "name": "Attacker Account",
        "email": unique_email,
        "password": "password123",
        "role": "ADMINISTRATOR"
    }
    res_reg = client.post("/api/auth/register", json=reg_payload)
    assert res_reg.status_code == 200
    assert res_reg.json()["role"] == "PASSENGER"

    # Admin list users
    res_users = client.get("/api/users", headers={"X-User-Role": "ADMINISTRATOR"})
    assert res_users.status_code == 200
    assert len(res_users.json()["users"]) > 0

    # Admin elevate user role
    target_user_id = res_reg.json()["id"]
    res_role = client.patch("/api/users/role", json={"user_id": target_user_id, "role": "EVENT_MANAGER"}, headers={"X-User-Role": "ADMINISTRATOR"})
    assert res_role.status_code == 200
    assert res_role.json()["new_role"] == "EVENT_MANAGER"

def test_optimizer_scales_with_fleet_size():
    # Test solving with current dynamic fleet from database
    result = optimizer_service.solve(scenario_name="baseline", demand_multiplier=1.0)
    assert "total_fleet_size" in result
    assert result["total_fleet_size"] > 0
    assert result["solver_status"] in ("OPTIMAL", "FEASIBLE")
