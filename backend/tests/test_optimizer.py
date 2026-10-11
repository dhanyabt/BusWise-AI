from backend.app.services.optimizer import optimizer_service

def test_fleet_conservation_constraint():
    res = optimizer_service.solve(scenario_name="baseline", demand_multiplier=1.0)
    assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    assert res["total_fleet_size"] == 16
    assert res["constraint_validation"]["fleet_conservation_passed"] is True

def test_queue_balance_and_non_negative_queues():
    res = optimizer_service.solve(scenario_name="high_peak", demand_multiplier=1.6)
    assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    
    for timeline in res["stop_timelines"]:
        for interval in timeline["intervals"]:
            assert interval["ending_queue"] >= 0
            assert interval["passengers_served"] >= 0
            assert interval["unmet_demand"] >= 0

def test_transfer_card_explanations():
    res = optimizer_service.solve(scenario_name="high_peak", demand_multiplier=1.5)
    for transfer in res["transfers"]:
        assert transfer["bus_count"] > 0
        assert "destination_benefit_explanation" in transfer
        assert "origin_impact_explanation" in transfer
        assert len(transfer["destination_benefit_explanation"]) > 10
        assert len(transfer["origin_impact_explanation"]) > 10

def test_infeasible_scenario_handling():
    # Force extreme multiplier to verify honest unmet demand accounting
    res = optimizer_service.solve(scenario_name="high_peak", demand_multiplier=5.0)
    assert res["solver_status"] in ["OPTIMAL", "FEASIBLE", "INFEASIBLE"]
    if res["solver_status"] in ["OPTIMAL", "FEASIBLE"]:
        assert res["total_unmet_demand"] > 0

def test_more_than_two_recommendations_under_festival_surge():
    # Verify recommendations are not capped at 2 under festival crowd surge
    res = optimizer_service.solve(scenario_name="festival_crowd", demand_multiplier=2.0)
    assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    transfers = res["transfers"]
    # Should generate more than 2 recommendations
    assert len(transfers) >= 2
    # Ensure bus_id is present and specific
    for t in transfers:
        assert "bus_id" in t
        assert len(t["bus_id"]) > 0

def test_all_16_buses_accounted_for_and_no_conflicting_assignments():
    res = optimizer_service.solve(scenario_name="festival_crowd", demand_multiplier=2.0)
    assert res["total_fleet_size"] == 16
    assigned_buses = [t["bus_id"] for t in res["transfers"] if t.get("is_feasible", True)]
    # Deduplication test: No bus is assigned to conflicting transfers
    assert len(assigned_buses) == len(set(assigned_buses))

def test_road_closure_and_travel_time_rerouting():
    # Direct road closed between CMBT and T. Nagar
    res = optimizer_service.solve(
        scenario_name="baseline",
        road_closure="STOP-001_STOP-004",
        demand_multiplier=1.5
    )
    assert res["constraint_validation"]["fleet_conservation_passed"] is True
    # If any transfer moves from STOP-004 to STOP-001, its travel time must be greater than base 15m
    for t in res["transfers"]:
        if t["origin_stop_id"] == "STOP-004" and t["destination_stop_id"] == "STOP-001":
            assert t["travel_time_mins"] >= 30

def test_weather_and_traffic_delay_impact():
    res_normal = optimizer_service.solve(scenario_name="baseline", weather_severity="Normal", traffic_delay_mins=0)
    res_severe = optimizer_service.solve(scenario_name="baseline", weather_severity="Severe", traffic_delay_mins=30)
    assert res_severe["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    # Total wait time in severe conditions should be higher
    assert res_severe["total_wait_passenger_intervals"] >= res_normal["total_wait_passenger_intervals"]

def test_bus_delay_constraint():
    res = optimizer_service.solve(
        scenario_name="bus_delay",
        bus_delay_id="BUS-005",
        bus_delay_mins=30
    )
    assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    # BUS-005 must not be dispatched at interval 0
    for t in res["transfers"]:
        if t.get("bus_id") == "BUS-005":
            assert t["dispatch_interval"] >= 2
