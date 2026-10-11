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

# 1. 4 Fictional Bus Stops (Tamil Nadu Transit Hubs)
DEMO_STOPS: List[Dict[str, Any]] = [
    {
        "id": "STOP-001",
        "name": "CMBT Koyambedu",
        "location_lat": 13.0694,
        "location_lng": 80.1948,
        "capacity": 800,
        "minimum_service_level": 2,
        "description": "Primary festival stage exit & transit terminal (CMBT Chennai) - High crowd density",
        "initial_queue": 120,
    },
    {
        "id": "STOP-002",
        "name": "Mylapore Temple Rd",
        "location_lat": 13.0334,
        "location_lng": 80.2699,
        "capacity": 400,
        "minimum_service_level": 1,
        "description": "Cultural district & festival temple precinct exit - Moderate steady flow",
        "initial_queue": 45,
    },
    {
        "id": "STOP-003",
        "name": "Chennai Central Rail",
        "location_lat": 13.0827,
        "location_lng": 80.2707,
        "capacity": 600,
        "minimum_service_level": 2,
        "description": "Intercity rail & metropolitan bus interchange - Peak arrivals at festival surge",
        "initial_queue": 30,
    },
    {
        "id": "STOP-004",
        "name": "T. Nagar Market Rd",
        "location_lat": 13.0418,
        "location_lng": 80.2341,
        "capacity": 350,
        "minimum_service_level": 1,
        "description": "Commercial feeder hub & shopping precinct - Secondary festival pickup point",
        "initial_queue": 20,
    },
]

# 2. Exactly 16 Fictional Buses (4 at CMBT, 2 at Mylapore, 3 at Central, 7 at T. Nagar)
DEMO_BUSES: List[Dict[str, Any]] = [
    {"id": "BUS-001", "bus_number": "BW-101", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-001", "current_stop_id": "STOP-001", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-002", "bus_number": "BW-102", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-001", "current_stop_id": "STOP-001", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-003", "bus_number": "BW-103", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-001", "current_stop_id": "STOP-001", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-004", "bus_number": "BW-104", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-001", "current_stop_id": "STOP-001", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},

    {"id": "BUS-005", "bus_number": "BW-201", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-002", "current_stop_id": "STOP-002", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-006", "bus_number": "BW-202", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-002", "current_stop_id": "STOP-002", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},

    {"id": "BUS-007", "bus_number": "BW-301", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-003", "current_stop_id": "STOP-003", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-008", "bus_number": "BW-302", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-003", "current_stop_id": "STOP-003", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-009", "bus_number": "BW-303", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-003", "current_stop_id": "STOP-003", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},

    {"id": "BUS-010", "bus_number": "BW-401", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-011", "bus_number": "BW-402", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-012", "bus_number": "BW-403", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-013", "bus_number": "BW-404", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-014", "bus_number": "BW-405", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-015", "bus_number": "BW-406", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
    {"id": "BUS-016", "bus_number": "BW-407", "capacity": 60, "status": "AVAILABLE", "initial_stop_id": "STOP-004", "current_stop_id": "STOP-004", "destination_stop_id": None, "assigned_service": None, "eta_minutes": None},
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
# Exact Prompt Values: CMBT: 380, Mylapore: 100, Central: 240, T. Nagar: 60
DEMO_FORECAST_ARRIVALS: Dict[str, List[int]] = {
    "STOP-001": [380, 380, 380, 380, 350, 310, 240, 180],  # CMBT Koyambedu (380 pax/15m peak)
    "STOP-002": [100, 100, 100, 100, 95, 90, 80, 70],     # Mylapore Temple Rd (100 pax/15m)
    "STOP-003": [240, 240, 240, 240, 220, 200, 160, 120], # Chennai Central Rail (240 pax/15m)
    "STOP-004": [60, 60, 60, 60, 55, 50, 45, 40],         # T. Nagar Market Rd (60 pax/15m)
}

# 5. Pre-defined Scenarios (DEMO MODE — SIMULATED DATA)
DEMO_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "baseline": {
        "name": "Normal Day",
        "demand_multiplier": 1.0,
        "peak_shift": 0,
        "min_service_override": 1,
        "weather_severity": "Normal",
        "traffic_delay_mins": 0,
        "road_closure": "NONE",
        "bus_delay_id": None,
        "bus_delay_mins": 0,
        "description": "Standard expected daily transit flow. Normal weather, no delays, all transit corridors open."
    },
    "normal_day": {
        "name": "Normal Day",
        "demand_multiplier": 1.0,
        "peak_shift": 0,
        "min_service_override": 1,
        "weather_severity": "Normal",
        "traffic_delay_mins": 0,
        "road_closure": "NONE",
        "bus_delay_id": None,
        "bus_delay_mins": 0,
        "description": "Standard expected daily transit flow. Normal weather, no delays, all transit corridors open."
    },
    "heavy_rain": {
        "name": "Heavy Rain",
        "demand_multiplier": 1.3,
        "peak_shift": 0,
        "min_service_override": 1,
        "weather_severity": "Severe",
        "traffic_delay_mins": 20,
        "road_closure": "NONE",
        "bus_delay_id": None,
        "bus_delay_mins": 0,
        "description": "Torrential monsoon downpour. Road transit travel times +50%, pedestrian walkability drops creating a 30% surge at sheltered transit hubs."
    },
    "festival_crowd": {
        "name": "Festival Crowd",
        "demand_multiplier": 2.0,
        "peak_shift": 1,
        "min_service_override": 1,
        "weather_severity": "Normal",
        "traffic_delay_mins": 15,
        "road_closure": "NONE",
        "bus_delay_id": None,
        "bus_delay_mins": 0,
        "description": "Massive cultural festival & concert crowd. Huge surge at CMBT Koyambedu (380 pax/15m) and Chennai Central Interchange (240 pax/15m)."
    },
    "high_peak": {
        "name": "Festival Crowd",
        "demand_multiplier": 2.0,
        "peak_shift": 1,
        "min_service_override": 1,
        "weather_severity": "Normal",
        "traffic_delay_mins": 15,
        "road_closure": "NONE",
        "bus_delay_id": None,
        "bus_delay_mins": 0,
        "description": "Massive cultural festival & concert crowd. Huge surge at CMBT Koyambedu (380 pax/15m) and Chennai Central Interchange (240 pax/15m)."
    },
    "traffic_congestion": {
        "name": "Traffic Congestion",
        "demand_multiplier": 1.1,
        "peak_shift": 0,
        "min_service_override": 1,
        "weather_severity": "Moderate",
        "traffic_delay_mins": 35,
        "road_closure": "NONE",
        "bus_delay_id": None,
        "bus_delay_mins": 0,
        "description": "Severe arterial gridlock along Poonamallee High Road and Anna Salai. Bus travel times delayed by 35 minutes across all corridors."
    },
    "bus_delay": {
        "name": "Bus Delay",
        "demand_multiplier": 1.2,
        "peak_shift": 0,
        "min_service_override": 1,
        "weather_severity": "Normal",
        "traffic_delay_mins": 10,
        "road_closure": "NONE",
        "bus_delay_id": "BUS-005",
        "bus_delay_mins": 30,
        "description": "Mechanical inspection delay for bus BUS-005 at Mylapore (30m delay). Bus is temporarily unavailable for dispatch during early intervals."
    },
    "emergency_combined": {
        "name": "Combined Emergency Scenario",
        "demand_multiplier": 2.2,
        "peak_shift": 1,
        "min_service_override": 2,
        "weather_severity": "Severe",
        "traffic_delay_mins": 45,
        "road_closure": "STOP-001_STOP-004",
        "bus_delay_id": "BUS-010",
        "bus_delay_mins": 40,
        "description": "Combined Multi-Hazard Emergency: Torrential monsoon rain, 2.2x festival crowd, 45m traffic delay, road closure between CMBT and T. Nagar, and delayed bus BUS-010."
    },
    "low_demand": {
        "name": "Afternoon Off-Peak",
        "demand_multiplier": 0.6,
        "peak_shift": 0,
        "min_service_override": 1,
        "weather_severity": "Normal",
        "traffic_delay_mins": 0,
        "road_closure": "NONE",
        "bus_delay_id": None,
        "bus_delay_mins": 0,
        "description": "Low passenger arrivals across all stops before main evening transit events start."
    }
}
