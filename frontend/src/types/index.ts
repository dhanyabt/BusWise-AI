// BusWise AI - Core TypeScript Types

export interface BusStop {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  capacity: number;
  minimum_service_level: number;
  description?: string;
  initial_queue: number;
}

export interface Bus {
  id: string;
  bus_number: string;
  capacity: number;
  status: 'AVAILABLE' | 'IN_SERVICE' | 'TRAVELING' | 'UNAVAILABLE' | 'MAINTENANCE' | 'DEACTIVATED';
  initial_stop_id?: string;
  current_stop_id?: string;
  destination_stop_id?: string;
  route_id?: string;
  assigned_service?: string;
  eta_minutes?: number;
}

export interface StopBusCount {
  stop_id: string;
  stop_name: string;
  bus_count: number;
}

export interface FleetSummary {
  registered_fleet: number;
  available_fleet: number;
  allocated_fleet: number;
  unallocated_fleet: number;
  total_buses: number;
  available_buses: number;
  in_service_buses: number;
  maintenance_buses: number;
  deactivated_buses: number;
  distribution_by_stop: StopBusCount[];
  buses: Bus[];
  is_demo_data: boolean;
}

export interface ForecastItem {
  interval_index: number;
  time_label: string;
  arrivals: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface StopForecast {
  stop_id: string;
  stop_name: string;
  initial_queue: number;
  intervals: ForecastItem[];
  total_2h_arrivals: number;
  peak_interval_index: number;
}

export interface ForecastResponse {
  scenario: string;
  demand_multiplier: number;
  stops_forecast: StopForecast[];
  evaluation_mae: number;
  model_type: string;
  is_demo_data: boolean;
  latest_manual_observation?: CrowdObservation | null;
  live_weather?: WeatherData | null;
  weather_forecast_notes?: string;
  is_experimental_weather_applied?: boolean;
}

export interface TransferCard {
  id: string;
  run_id?: string;
  origin_stop_id: string;
  origin_stop_name: string;
  destination_stop_id: string;
  destination_stop_name: string;
  bus_id?: string;
  bus_count: number;
  dispatch_interval: number;
  dispatch_time_label: string;
  arrival_interval: number;
  arrival_time_label: string;
  destination_benefit_explanation: string;
  origin_impact_explanation: string;
  expected_destination_queue_change?: number;
  expected_origin_queue_change?: number;
  min_service_status?: string;
  fleet_conservation_status?: string;
  forecast_scenario?: string;
  remaining_unmet_demand?: number;
  approval_status?: string;
  approved_at?: string;
  approved_by?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  travel_time_mins?: number;
  is_feasible?: boolean;
  infeasibility_reason?: string;
}

export interface IntervalStopState {
  interval_index: number;
  time_label: string;
  buses_stationed: number;
  buses_departing: number;
  buses_arriving: number;
  arrivals: number;
  passengers_served: number;
  ending_queue: number;
  unmet_demand: number;
  crowd_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface StopTimeline {
  stop_id: string;
  stop_name: string;
  initial_queue: number;
  intervals: IntervalStopState[];
  total_arrivals: number;
  total_served: number;
  peak_queue: number;
  total_unmet_demand: number;
}

export interface ConstraintValidation {
  fleet_conservation_passed: boolean;
  travel_time_feasibility_passed: boolean;
  capacity_constraint_passed: boolean;
  min_service_requirement_passed: boolean;
  non_negative_queues_passed: boolean;
  details: string[];
}

export interface OptimizationResponse {
  run_id: string;
  solver_status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'MODEL_INVALID';
  solver_name: string;
  scenario_name: string;
  total_fleet_size: number;
  solve_duration_ms: number;
  objective_value: number;
  total_unmet_demand: number;
  total_wait_passenger_intervals: number;
  transfers: TransferCard[];
  stop_timelines: StopTimeline[];
  constraint_validation: ConstraintValidation;
  is_demo_data: boolean;
}

export interface ScenarioParams {
  scenario_name: string;
  demand_multiplier: number;
  min_service_level: number;
  bus_capacity: number;
  weight_queue: number;
  weight_unmet: number;
  weight_transfer: number;
  weather_severity?: 'Normal' | 'Moderate' | 'Severe';
  traffic_delay_mins?: number;
  road_closure?: string;
  bus_delay_id?: string;
  bus_delay_mins?: number;
  stop_crowd_boost?: Record<string, number>;
}

export interface TimeToSurgeItem {
  stop_id: string;
  stop_name: string;
  current_queue: number;
  predicted_surge_interval: number | null;
  predicted_surge_time_label: string;
  estimated_time_remaining_minutes: number;
  latest_feasible_dispatch_interval: number | null;
  latest_feasible_dispatch_time_label: string;
  risk_level: string;
  available_response_options: string[];
  confidence_score: number;
  data_freshness: string;
  has_sufficient_data: boolean;
}

export interface TimeToSurgeResponse {
  scenario: string;
  threshold_queue: number;
  stops_surge: TimeToSurgeItem[];
  is_demo_data: boolean;
}

export type UserRole = 'PASSENGER' | 'OFFICER' | 'POLICE';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agency: string;
  badge_number?: string;
  token: string;
}

// Live Routing & OpenRouteService Types
export interface RouteStep {
  distance_meters: number;
  duration_seconds: number;
  instruction: string;
  name?: string;
}

export interface RouteResponse {
  route_id: string;
  origin_lat: number;
  origin_lng: number;
  origin_name?: string;
  destination_lat: number;
  destination_lng: number;
  destination_name?: string;
  distance_km: number;
  duration_minutes: number;
  geometry: [number, number][]; // [lat, lng] list for Leaflet Polyline
  steps: RouteStep[];
  routing_provider: string;
  error_message?: string;
}

export interface LocationSearchItem {
  id: string;
  name: string;
  label: string;
  lat: number;
  lng: number;
  category?: string;
  city?: string;
}

export interface LocationSearchResponse {
  query: string;
  results: LocationSearchItem[];
}

// Traccar Live GPS Tracking Types
export interface TrackedVehicle {
  bus_id: string;
  bus_number: string;
  device_id?: number | null;
  device_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  speed_kmh?: number | null;
  heading?: number | null;
  last_update?: string | null;
  status: 'LIVE' | 'STALE' | 'OFFLINE' | 'NO_GPS_FIX' | 'UNTRACKED';
  is_live_gps: boolean;
  assigned_stop_id?: string | null;
  assigned_stop_name?: string | null;
  fleet_status: string;
  battery_level?: number | null;
}

export interface TraccarStatusResponse {
  is_configured: boolean;
  traccar_url: string;
  connection_status: 'CONNECTED' | 'UNREACHABLE' | 'AUTH_FAILED' | 'NOT_CONFIGURED';
  message: string;
  total_registered_fleet: number;
  active_tracked_devices: number;
  online_devices: number;
}

export interface FleetTrackingResponse {
  traccar_status: TraccarStatusResponse;
  vehicles: TrackedVehicle[];
  last_poll_time: string;
}

// Live Open-Meteo Weather Integration Types
export interface HourlyForecastItem {
  time: string;
  temperature_c: number;
  precipitation_probability: number;
  rain_mm: number;
  weather_condition: string;
}

export interface WeatherData {
  location_name: string;
  latitude: number;
  longitude: number;
  current_temperature_c: number | null;
  apparent_temperature_c: number | null;
  precipitation_mm: number | null;
  relative_humidity_pct: number | null;
  wind_speed_kmh: number | null;
  weather_condition: string;
  weather_code: number | null;
  forecast_time: string | null;
  last_updated_at: string;
  status: 'live' | 'stale' | 'unavailable';
  provider: string;
  is_experimental_forecast_input: boolean;
  hourly_forecast: HourlyForecastItem[];
  message: string;
}

// Manual Crowd-Count Observation Types
export interface CrowdObservationAudit {
  edited_by: string;
  edited_at: string;
  previous_values: Record<string, any>;
}

export interface CrowdObservation {
  id: number;
  event_id: string;
  occurrence_id?: string | null;
  location: string;
  observed_count: number;
  observed_at: string;
  reported_by: string;
  reported_at: string;
  notes?: string | null;
  source?: string | null;
  is_manually_reported: boolean;
  edited_by?: string | null;
  edited_at?: string | null;
  audit_trail?: CrowdObservationAudit[];
}

export interface LatestObservationResponse {
  has_observation: boolean;
  event_id: string;
  observation?: CrowdObservation;
  label: string;
  provenance_note?: string;
  message?: string;
}


