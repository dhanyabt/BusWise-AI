from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_approve_transfer_workflow():
    # Run optimization with high_peak scenario to generate transfers
    opt_res = client.post("/api/optimize", json={"scenario_name": "high_peak", "demand_multiplier": 1.5}).json()
    assert len(opt_res["transfers"]) > 0
    t_id = opt_res["transfers"][0]["id"]

    # Approve transfer
    approve_res = client.post(f"/api/transfers/{t_id}/approve", json={"operator_id": "OP-77"}).json()
    assert approve_res["id"] == t_id
    assert approve_res["approval_status"] == "APPROVED"
    assert approve_res["approved_by"] == "OP-77"
    assert approve_res["approved_at"] is not None
    assert "T" in approve_res["approved_at"]

def test_reject_transfer_workflow():
    opt_res = client.post("/api/optimize", json={"scenario_name": "high_peak", "demand_multiplier": 1.5}).json()
    assert len(opt_res["transfers"]) > 0
    t_id = opt_res["transfers"][0]["id"]
    reject_res = client.post(f"/api/transfers/{t_id}/reject", json={"operator_id": "OP-88"}).json()
    assert reject_res["approval_status"] == "REJECTED"
    assert reject_res["approved_by"] == "OP-88"
