"""
BusWise AI - Centralized Demo Data Module
DEMO DATA — NOT LIVE

Contains:
- 4 Fictional Bus Stops (Main Stand, Temple Road, Railway Station, Market Road)
- Exactly 16 Fictional Buses (BW-101 to BW-403) with capacity 60 each
- Travel time matrix (minutes and 15-minute intervals)
- Initial passenger queues
- 2-hour planning horizon (8 intervals of 15 minutes: T0 to T7)
- Minimum service requirements per stop
- Baseline, High Peak, and Low Demand scenarios
"""

from typing import Dict, List, Any

# Planning Horizon: 8 intervals of 15 minutes = 2 hours
PLANNING_INTERVALS = 8
INTERVAL_MINUTES = 15

# 1. 4 Fictional Bus Stops
DEMO_STOPS: List[Dict[str, Any]] = [
    {
        "id": "STOP-001",
        "name": "Main Stand",
        "location_lat": 12.9716,
        "location_lng": 77.5946,
        "capacity": 800,
        "minimum_service_level": 2,
        "description": "Primary festival stage exit & transport hub - High crowd density",
        "initial_queue": 120,
    },
    {
        "id": "STOP-002",
        "name": "Temple Road",
        "location_lat": 12.9780,
        "location_lng": 77.6000,
        "capacity": 400,
        "minimum_service_level": 1,
        "description": "North exit route near cultural area - Moderate steady flow",
        "initial_queue": 45,
    },
    {
        "id": "STOP-003",
        "name": "Railway Station",
        "location_lat": 12.9650,
        "location_lng": 77.5800,
        "capacity": 600,
        "minimum_service_level": 2,
        "description": "Main intercity transit connector - Peak arrivals at festival end",
        "initial_queue": 30,
    },
    {
        "id": "STOP-004",
        "name": "Market Road",
        "location_lat": 12.9850,
        "location_lng": 77.5900,
        "capacity": 350,
        "minimum_service_level": 1,
        "description": "Commercial district feeder stop - Secondary pickup point",
        "initial_queue": 20,
    },
]

# 2. Exactly 16 Fictional Buses
DEMO_BUSES: List[Dict[str, Any]] = [
    {"id": "BUS-001", "bus_number": "BW-101", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-001", "current_stop_id": "STOP-001"},
    {"id": "BUS-002", "bus_number": "BW-102", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-001", "current_stop_id": "STOP-001"},
    {"id": "BUS-003", "bus_number": "BW-103", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-001", "current_stop_id": "STOP-001"},
    {"id": "BUS-004", "bus_number": "BW-104", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-001", "current_stop_id": "STOP-001"},
    {"id": "BUS-005", "bus_number": "BW-105", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-001", "current_stop_id": "STOP-001"},

    {"id": "BUS-006", "bus_number": "BW-201", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-002", "current_stop_id": "STOP-002"},
    {"id": "BUS-007", "bus_number": "BW-202", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-002", "current_stop_id": "STOP-002"},
    {"id": "BUS-008", "bus_number": "BW-203", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-002", "current_stop_id": "STOP-002"},
    {"id": "BUS-009", "bus_number": "BW-204", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-002", "current_stop_id": "STOP-002"},

    {"id": "BUS-010", "bus_number": "BW-301", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-003", "current_stop_id": "STOP-003"},
    {"id": "BUS-011", "bus_number": "BW-302", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-003", "current_stop_id": "STOP-003"},
    {"id": "BUS-012", "bus_number": "BW-303", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-003", "current_stop_id": "STOP-003"},
    {"id": "BUS-013", "bus_number": "BW-304", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-003", "current_stop_id": "STOP-003"},

    {"id": "BUS-014", "bus_number": "BW-401", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004"},
    {"id": "BUS-015", "bus_number": "BW-402", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004"},
    {"id": "BUS-016", "bus_number": "BW-403", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004"},
]

# 3. Travel Time Matrix: (origin_id, dest_id) -> (travel_time_minutes, interval_duration)
# 15 min travel time = 1 interval; 30 min travel time = 2 intervals; 0 min = 0 intervals
DEMO_TRAVEL_TIMES: Dict[tuple, Dict[str, int]] = {
    ("STOP-001", "STOP-001"): {"minutes": 0, "intervals": 0},
    ("STOP-001", "STOP-002"): {"minutes": 15, "intervals": 1},
    ("STOP-001", "STOP-003"): {"minutes": 30, "intervals": 2},
    ("STOP-001", "STOP-004"): {"minutes": 15, "intervals": 1},

    ("STOP-002", "STOP-001"): {"minutes": 15, "intervals": 1},
    ("STOP-002", "STOP-002"): {"minutes": 0, "intervals": 0},
    ("STOP-002", "STOP-003"): {"minutes": 30, "intervals": 2},
    ("STOP-002", "STOP-004"): {"minutes": 15, "intervals": 1},

    ("STOP-003", "STOP-001"): {"minutes": 30, "intervals": 2},
    ("STOP-003", "STOP-002"): {"minutes": 30, "intervals": 2},
    ("STOP-003", "STOP-003"): {"minutes": 0, "intervals": 0},
    ("STOP-003", "STOP-004"): {"minutes": 30, "intervals": 2},

    ("STOP-004", "STOP-001"): {"minutes": 15, "intervals": 1},
    ("STOP-004", "STOP-002"): {"minutes": 15, "intervals": 1},
    ("STOP-004", "STOP-003"): {"minutes": 30, "intervals": 2},
    ("STOP-004", "STOP-004"): {"minutes": 0, "intervals": 0},
}

# 4. Base Arrival Forecast Matrix: stop_id -> list of arrivals for T0..T7 (15-min intervals)
DEMO_FORECAST_ARRIVALS: Dict[str, List[int]] = {
    "STOP-001": [120, 180, 320, 380, 310, 220, 140, 90],  # Festival stage exit surge (Peaks T2-T4)
    "STOP-002": [40, 55, 70, 85, 90, 75, 50, 35],         # Steady cultural exit
    "STOP-003": [30, 45, 80, 130, 210, 260, 190, 110],    # Railway station surge (Peaks T4-T6)
    "STOP-004": [20, 25, 35, 45, 50, 40, 30, 20],         # Commercial area low flow
}

# 5. Pre-defined Scenarios
DEMO_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "baseline": {
        "name": "Baseline Festival Flow",
        "demand_multiplier": 1.0,
        "peak_shift": 0,
        "min_service_override": 1,
        "description": "Standard expected evening crowd arrivals during festival schedule."
    },
    "high_peak": {
        "name": "Headliner Surge (High Peak)",
        "demand_multiplier": 1.5,
        "peak_shift": 1,
        "min_service_override": 2,
        "description": "Concert ends abruptly. Massive surge at Main Stand (STOP-001) and Railway Station (STOP-003)."
    },
    "low_demand": {
        "name": "Afternoon Off-Peak",
        "demand_multiplier": 0.6,
        "peak_shift": 0,
        "min_service_override": 1,
        "description": "Low passenger arrivals across all stops before main festival events start."
    }
}
