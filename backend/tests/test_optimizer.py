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
