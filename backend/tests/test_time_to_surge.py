from backend.app.services.time_to_surge import time_to_surge_service

def test_time_to_surge_calculation():
    res = time_to_surge_service.calculate_surge_timings(scenario_name="baseline", demand_multiplier=1.0)
    assert res["scenario"] == "baseline"
    assert len(res["stops_surge"]) == 4
    
    for item in res["stops_surge"]:
        assert "predicted_surge_time_label" in item
        assert "latest_feasible_dispatch_time_label" in item
        assert item["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert len(item["available_response_options"]) > 0

def test_high_peak_surge_acceleration():
    base = time_to_surge_service.calculate_surge_timings("baseline", 1.0)
    surge = time_to_surge_service.calculate_surge_timings("high_peak", 1.8)
    
    base_main = next(s for s in base["stops_surge"] if s["stop_id"] == "STOP-001")
    surge_main = next(s for s in surge["stops_surge"] if s["stop_id"] == "STOP-001")
    
    # In high peak, estimated time remaining until threshold cross should be less than or equal to baseline
    assert surge_main["estimated_time_remaining_minutes"] <= base_main["estimated_time_remaining_minutes"]
