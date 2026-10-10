from backend.app.services.forecasting import forecasting_service

def test_demand_forecasting_pipeline():
    res = forecasting_service.get_forecasts(scenario_name="baseline", multiplier=1.0)
    assert res["scenario"] == "baseline"
    assert len(res["stops_forecast"]) == 4
    assert res["evaluation_mae"] >= 0.0

    for sf in res["stops_forecast"]:
        assert sf["stop_id"] in ["STOP-001", "STOP-002", "STOP-003", "STOP-004"]
        assert len(sf["intervals"]) == 8  # 8 x 15-min intervals = 2 hours
        for item in sf["intervals"]:
            assert item["arrivals"] >= 0

def test_high_peak_scenario_scaling():
    base_res = forecasting_service.get_forecasts("baseline", 1.0)
    peak_res = forecasting_service.get_forecasts("high_peak", 1.5)
    
    base_stop1 = next(s for s in base_res["stops_forecast"] if s["stop_id"] == "STOP-001")
    peak_stop1 = next(s for s in peak_res["stops_forecast"] if s["stop_id"] == "STOP-001")
    
    assert peak_stop1["total_2h_arrivals"] > base_stop1["total_2h_arrivals"]
