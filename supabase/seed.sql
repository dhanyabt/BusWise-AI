-- BusWise AI Seed Data Script
-- Exactly 4 Fictional Bus Stops and 16 Fictional Buses

-- 1. Seed Bus Stops
INSERT INTO stops (id, name, location_lat, location_lng, capacity, minimum_service_level, description) VALUES
('STOP-001', 'Main Stand', 12.9716, 77.5946, 800, 2, 'Primary festival stage exit & transport hub - High crowd density'),
('STOP-002', 'Temple Road', 12.9780, 77.6000, 400, 1, 'North exit route near cultural area - Moderate steady flow'),
('STOP-003', 'Railway Station', 12.9650, 77.5800, 600, 2, 'Main intercity transit connector - Peak arrivals at festival end'),
('STOP-004', 'Market Road', 12.9850, 77.5900, 350, 1, 'Commercial district feeder stop - Secondary pickup point')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng;

-- 2. Seed 16 Fictional Buses
INSERT INTO buses (id, bus_number, capacity, status, initial_stop_id, current_stop_id) VALUES
('BUS-001', 'BW-101', 60, 'AVAILABLE', 'STOP-001', 'STOP-001'),
('BUS-002', 'BW-102', 60, 'AVAILABLE', 'STOP-001', 'STOP-001'),
('BUS-003', 'BW-103', 60, 'AVAILABLE', 'STOP-001', 'STOP-001'),
('BUS-004', 'BW-104', 60, 'AVAILABLE', 'STOP-001', 'STOP-001'),
('BUS-005', 'BW-105', 60, 'AVAILABLE', 'STOP-001', 'STOP-001'),

('BUS-006', 'BW-201', 60, 'AVAILABLE', 'STOP-002', 'STOP-002'),
('BUS-007', 'BW-202', 60, 'AVAILABLE', 'STOP-002', 'STOP-002'),
('BUS-008', 'BW-203', 60, 'AVAILABLE', 'STOP-002', 'STOP-002'),
('BUS-009', 'BW-204', 60, 'AVAILABLE', 'STOP-002', 'STOP-002'),

('BUS-010', 'BW-301', 60, 'AVAILABLE', 'STOP-003', 'STOP-003'),
('BUS-011', 'BW-302', 60, 'AVAILABLE', 'STOP-003', 'STOP-003'),
('BUS-012', 'BW-303', 60, 'AVAILABLE', 'STOP-003', 'STOP-003'),
('BUS-013', 'BW-304', 60, 'AVAILABLE', 'STOP-003', 'STOP-003'),

('BUS-014', 'BW-401', 60, 'AVAILABLE', 'STOP-004', 'STOP-004'),
('BUS-015', 'BW-402', 60, 'AVAILABLE', 'STOP-004', 'STOP-004'),
('BUS-016', 'BW-403', 60, 'AVAILABLE', 'STOP-004', 'STOP-004')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, current_stop_id = EXCLUDED.current_stop_id;

-- 3. Seed Travel Time Matrix (minutes and 15-min planning intervals)
INSERT INTO travel_times (origin_stop_id, destination_stop_id, travel_time_minutes, interval_duration) VALUES
('STOP-001', 'STOP-001', 0, 0),
('STOP-001', 'STOP-002', 15, 1),
('STOP-001', 'STOP-003', 30, 2),
('STOP-001', 'STOP-004', 15, 1),

('STOP-002', 'STOP-001', 15, 1),
('STOP-002', 'STOP-002', 0, 0),
('STOP-002', 'STOP-003', 30, 2),
('STOP-002', 'STOP-004', 15, 1),

('STOP-003', 'STOP-001', 30, 2),
('STOP-003', 'STOP-002', 30, 2),
('STOP-003', 'STOP-003', 0, 0),
('STOP-003', 'STOP-004', 30, 2),

('STOP-004', 'STOP-001', 15, 1),
('STOP-004', 'STOP-002', 15, 1),
('STOP-004', 'STOP-003', 30, 2),
('STOP-004', 'STOP-004', 0, 0)
ON CONFLICT (origin_stop_id, destination_stop_id) DO UPDATE SET travel_time_minutes = EXCLUDED.travel_time_minutes;

-- 4. Seed Scenarios
INSERT INTO scenario_inputs (scenario_name, demand_multiplier, peak_shift_interval, min_service_override, parameters_json) VALUES
('baseline', 1.0, 0, 1, '{"description": "Expected festival evening surge"}'::jsonb),
('high_peak', 1.6, 1, 2, '{"description": "Major headliner concert ending - Extreme overcrowding risk"}'::jsonb),
('low_demand', 0.6, 0, 1, '{"description": "Off-peak festival afternoon - Low passenger volume"}'::jsonb)
ON CONFLICT (scenario_name) DO NOTHING;

-- 5. Seed Baseline Forecast Arrivals (2-hour horizon, 8 x 15min intervals T0..T7)
-- STOP-001 Main Stand (Peaks T2-T4)
INSERT INTO demand_forecasts (stop_id, interval_index, interval_time, arrival_count, scenario) VALUES
('STOP-001', 0, NOW() + INTERVAL '0 min', 120, 'baseline'),
('STOP-001', 1, NOW() + INTERVAL '15 min', 180, 'baseline'),
('STOP-001', 2, NOW() + INTERVAL '30 min', 320, 'baseline'),
('STOP-001', 3, NOW() + INTERVAL '45 min', 380, 'baseline'),
('STOP-001', 4, NOW() + INTERVAL '60 min', 310, 'baseline'),
('STOP-001', 5, NOW() + INTERVAL '75 min', 220, 'baseline'),
('STOP-001', 6, NOW() + INTERVAL '90 min', 140, 'baseline'),
('STOP-001', 7, NOW() + INTERVAL '105 min', 90, 'baseline'),

-- STOP-002 Temple Road (Steady Moderate)
('STOP-002', 0, NOW() + INTERVAL '0 min', 40, 'baseline'),
('STOP-002', 1, NOW() + INTERVAL '15 min', 55, 'baseline'),
('STOP-002', 2, NOW() + INTERVAL '30 min', 70, 'baseline'),
('STOP-002', 3, NOW() + INTERVAL '45 min', 85, 'baseline'),
('STOP-002', 4, NOW() + INTERVAL '60 min', 90, 'baseline'),
('STOP-002', 5, NOW() + INTERVAL '75 min', 75, 'baseline'),
('STOP-002', 6, NOW() + INTERVAL '90 min', 50, 'baseline'),
('STOP-002', 7, NOW() + INTERVAL '105 min', 35, 'baseline'),

-- STOP-003 Railway Station (Late Peak T4-T6)
('STOP-003', 0, NOW() + INTERVAL '0 min', 30, 'baseline'),
('STOP-003', 1, NOW() + INTERVAL '15 min', 45, 'baseline'),
('STOP-003', 2, NOW() + INTERVAL '30 min', 80, 'baseline'),
('STOP-003', 3, NOW() + INTERVAL '45 min', 130, 'baseline'),
('STOP-003', 4, NOW() + INTERVAL '60 min', 210, 'baseline'),
('STOP-003', 5, NOW() + INTERVAL '75 min', 260, 'baseline'),
('STOP-003', 6, NOW() + INTERVAL '90 min', 190, 'baseline'),
('STOP-003', 7, NOW() + INTERVAL '105 min', 110, 'baseline'),

-- STOP-004 Market Road (Low Flow)
('STOP-004', 0, NOW() + INTERVAL '0 min', 20, 'baseline'),
('STOP-004', 1, NOW() + INTERVAL '15 min', 25, 'baseline'),
('STOP-004', 2, NOW() + INTERVAL '30 min', 35, 'baseline'),
('STOP-004', 3, NOW() + INTERVAL '45 min', 45, 'baseline'),
('STOP-004', 4, NOW() + INTERVAL '60 min', 50, 'baseline'),
('STOP-004', 5, NOW() + INTERVAL '75 min', 40, 'baseline'),
('STOP-004', 6, NOW() + INTERVAL '90 min', 30, 'baseline'),
('STOP-004', 7, NOW() + INTERVAL '105 min', 20, 'baseline')
ON CONFLICT (stop_id, interval_index, scenario) DO UPDATE SET arrival_count = EXCLUDED.arrival_count;

-- 6. Seed Standard Multi-Role Users
INSERT INTO users (id, name, email, password_hash, salt, role, agency, badge_number, token) VALUES
('usr-001', 'Alex Morgan (Attendee)', 'passenger@buswise.ai', '4314757c9ecda894c2ad2c3589b35b6c3104c4416a2ef69d7a2fa26588a4bf57', 'e1b4f2c9085d4e138a34293f01b7a2d8', 'PASSENGER', 'Public Transit Rider', NULL, 'token-passenger-12345'),
('usr-002', 'Cmdr. Sarah Vance', 'officer@buswise.ai', '4314757c9ecda894c2ad2c3589b35b6c3104c4416a2ef69d7a2fa26588a4bf57', 'e1b4f2c9085d4e138a34293f01b7a2d8', 'OFFICER', 'Department of Public Transport', 'DPT-8092', 'token-officer-67890'),
('usr-003', 'Capt. James Miller', 'police@buswise.ai', '4314757c9ecda894c2ad2c3589b35b6c3104c4416a2ef69d7a2fa26588a4bf57', 'e1b4f2c9085d4e138a34293f01b7a2d8', 'POLICE', 'Festival Crowd Safety & Police Dispatch', 'PD-4412', 'token-police-13579')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, token = EXCLUDED.token;

