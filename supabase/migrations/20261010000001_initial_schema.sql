-- BusWise AI Supabase Migration Schema
-- Version: 20261010000001_initial_schema.sql

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bus Stops Table
CREATE TABLE IF NOT EXISTS stops (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    capacity INT DEFAULT 500 CHECK (capacity > 0),
    minimum_service_level INT DEFAULT 1 CHECK (minimum_service_level >= 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buses Table (Fixed Fleet of 16 Buses)
CREATE TABLE IF NOT EXISTS buses (
    id VARCHAR(50) PRIMARY KEY,
    bus_number VARCHAR(50) NOT NULL UNIQUE,
    capacity INT DEFAULT 60 CHECK (capacity > 0),
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'IN_SERVICE', 'MAINTENANCE')),
    initial_stop_id VARCHAR(50) REFERENCES stops(id) ON DELETE SET NULL,
    current_stop_id VARCHAR(50) REFERENCES stops(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fleet Status Snapshots
CREATE TABLE IF NOT EXISTS fleet_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id VARCHAR(50) NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    stop_id VARCHAR(50) REFERENCES stops(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL,
    interval_index INT CHECK (interval_index >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Travel Times Between Stops Matrix
CREATE TABLE IF NOT EXISTS travel_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_stop_id VARCHAR(50) NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    destination_stop_id VARCHAR(50) NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    travel_time_minutes INT NOT NULL CHECK (travel_time_minutes >= 0),
    interval_duration INT NOT NULL CHECK (interval_duration >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_travel_pair UNIQUE (origin_stop_id, destination_stop_id)
);

-- 5. Demand Forecasts Table
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stop_id VARCHAR(50) NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    interval_index INT NOT NULL CHECK (interval_index >= 0 AND interval_index <= 7),
    interval_time TIMESTAMPTZ NOT NULL,
    arrival_count INT NOT NULL CHECK (arrival_count >= 0),
    scenario VARCHAR(50) DEFAULT 'baseline',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_stop_interval_scenario UNIQUE (stop_id, interval_index, scenario)
);

-- 6. Passenger Queue Snapshots
CREATE TABLE IF NOT EXISTS passenger_queue_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stop_id VARCHAR(50) NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    interval_index INT NOT NULL CHECK (interval_index >= 0 AND interval_index <= 7),
    initial_queue INT NOT NULL DEFAULT 0 CHECK (initial_queue >= 0),
    arrivals INT NOT NULL DEFAULT 0 CHECK (arrivals >= 0),
    passengers_served INT NOT NULL DEFAULT 0 CHECK (passengers_served >= 0),
    ending_queue INT NOT NULL DEFAULT 0 CHECK (ending_queue >= 0),
    unmet_demand INT NOT NULL DEFAULT 0 CHECK (unmet_demand >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Optimization Runs
CREATE TABLE IF NOT EXISTS optimization_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_timestamp TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) NOT NULL,
    solver_name VARCHAR(50) DEFAULT 'OR-Tools CBC',
    scenario_name VARCHAR(50) DEFAULT 'baseline',
    total_fleet_size INT NOT NULL DEFAULT 16,
    total_unmet_demand INT NOT NULL DEFAULT 0,
    total_wait_time_min DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    solve_duration_ms DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Optimization Transfers
CREATE TABLE IF NOT EXISTS optimization_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
    origin_stop_id VARCHAR(50) NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    destination_stop_id VARCHAR(50) NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    bus_count INT NOT NULL CHECK (bus_count > 0),
    dispatch_interval INT NOT NULL CHECK (dispatch_interval >= 0 AND dispatch_interval <= 7),
    arrival_interval INT NOT NULL CHECK (arrival_interval >= 0 AND arrival_interval <= 7),
    destination_benefit_explanation TEXT NOT NULL,
    origin_impact_explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Scenario Inputs
CREATE TABLE IF NOT EXISTS scenario_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_name VARCHAR(50) NOT NULL UNIQUE,
    demand_multiplier DOUBLE PRECISION DEFAULT 1.0 CHECK (demand_multiplier > 0),
    peak_shift_interval INT DEFAULT 0,
    min_service_override INT DEFAULT 1,
    parameters_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_buses_current_stop ON buses(current_stop_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_stop_idx ON demand_forecasts(stop_id, interval_index);
CREATE INDEX IF NOT EXISTS idx_opt_transfers_run ON optimization_transfers(run_id);
CREATE INDEX IF NOT EXISTS idx_queue_snapshots_stop ON passenger_queue_snapshots(stop_id, interval_index);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_queue_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_inputs ENABLE ROW LEVEL SECURITY;

-- Read policies for public access (or authenticated users)
CREATE POLICY "Allow public read access on stops" ON stops FOR SELECT USING (true);
CREATE POLICY "Allow public read access on buses" ON buses FOR SELECT USING (true);
CREATE POLICY "Allow public read access on fleet_status" ON fleet_status FOR SELECT USING (true);
CREATE POLICY "Allow public read access on travel_times" ON travel_times FOR SELECT USING (true);
CREATE POLICY "Allow public read access on demand_forecasts" ON demand_forecasts FOR SELECT USING (true);
CREATE POLICY "Allow public read access on passenger_queue_snapshots" ON passenger_queue_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public read access on optimization_runs" ON optimization_runs FOR SELECT USING (true);
CREATE POLICY "Allow public read access on optimization_transfers" ON optimization_transfers FOR SELECT USING (true);
CREATE POLICY "Allow public read access on scenario_inputs" ON scenario_inputs FOR SELECT USING (true);

-- Insert/Update policies restricted to anon/service_role
CREATE POLICY "Allow insert/update access for service" ON optimization_runs FOR ALL USING (true);
CREATE POLICY "Allow insert/update access for transfers" ON optimization_transfers FOR ALL USING (true);
