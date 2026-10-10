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
  status: 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE';
  initial_stop_id?: string;
  current_stop_id?: string;
}

export interface StopBusCount {
  stop_id: string;
  stop_name: string;
  bus_count: number;
}

export interface FleetSummary {
  total_buses: number;
  available_buses: number;
  in_service_buses: number;
  maintenance_buses: number;
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
}

export interface TransferCard {
  id: string;
  run_id?: string;
  origin_stop_id: string;
  origin_stop_name: string;
  destination_stop_id: string;
  destination_stop_name: string;
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
