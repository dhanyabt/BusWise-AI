import type {
  BusStop,
  FleetSummary,
  ForecastResponse,
  OptimizationResponse,
  ScenarioParams,
  TransferCard,
  UserSession,
  RouteResponse,
  LocationSearchResponse,
  FleetTrackingResponse,
  TraccarStatusResponse,
} from '../types';

import {
  DEMO_STOPS_DATA,
  DEMO_FLEET_DATA,
  DEMO_FORECAST_DATA,
  DEMO_OPTIMIZATION_DATA,
} from '../data/demoData';

export const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function fetchHealthStatus(): Promise<{ healthy: boolean; message: string; is_demo: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return { healthy: true, message: data.message || 'Connected', is_demo: data.demo_mode ?? true };
    }
  } catch (err) {
    console.warn('Backend unavailable. Operating in offline demo fallback mode.');
  }
  return { healthy: false, message: 'Offline Demo Fallback', is_demo: true };
}

export async function fetchBusStops(): Promise<{ stops: BusStop[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/stops`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable. Using local demo bus stops.');
  }
  return { stops: DEMO_STOPS_DATA };
}

export async function fetchFleetSummary(): Promise<FleetSummary> {
  try {
    const res = await fetch(`${API_BASE}/api/fleet`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable. Using local demo fleet summary.');
  }
  return DEMO_FLEET_DATA;
}

export async function fetchForecasts(scenario = 'baseline', multiplier = 1.0): Promise<ForecastResponse> {
  try {
    const res = await fetch(
      `${API_BASE}/api/forecasts?scenario=${scenario}&multiplier=${multiplier}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable. Using local demo forecasts.');
  }
  return { ...DEMO_FORECAST_DATA, scenario, demand_multiplier: multiplier };
}

export async function runOptimization(params: ScenarioParams, token?: string): Promise<OptimizationResponse> {
  try {
    const payload = {
      scenario_name: params.scenario_name,
      demand_multiplier: params.demand_multiplier,
      min_service_level: params.min_service_level,
      bus_capacity: params.bus_capacity,
      weather_severity: params.weather_severity || 'Normal',
      traffic_delay_mins: params.traffic_delay_mins || 0,
      road_closure: params.road_closure || 'NONE',
      bus_delay_id: params.bus_delay_id || null,
      bus_delay_mins: params.bus_delay_mins || 0,
      weights: {
        weight_queue: params.weight_queue,
        weight_unmet: params.weight_unmet,
        weight_transfer: params.weight_transfer,
      },
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/optimize`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend optimizer unavailable. Returning local simulation optimization.');
  }
  return { ...DEMO_OPTIMIZATION_DATA, scenario_name: params.scenario_name };
}

export async function approveTransfer(transferId: string, operatorId: string, token?: string): Promise<TransferCard | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/transfers/${transferId}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operator_id: operatorId }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable for transfer approval.');
  }
  return null;
}

export async function arriveTransfer(transferId: string, token?: string): Promise<TransferCard | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/transfers/${transferId}/arrive`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable for transfer arrival simulation.');
  }
  return null;
}

export async function resetDemoFleet(): Promise<FleetSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/api/fleet/reset-demo`, {
      method: 'POST',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable for demo reset.');
  }
  return null;
}

export async function rejectTransfer(transferId: string, operatorId: string, token?: string): Promise<TransferCard | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/transfers/${transferId}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operator_id: operatorId }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable for transfer rejection.');
  }
  return null;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password?: string;
  role: string;
  agency?: string;
  badge_number?: string;
}): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const detail = errorBody?.detail || `Registration failed with status ${res.status}`;
    throw new Error(detail);
  }

  return await res.json();
}

export async function loginUser(payload: {
  email: string;
  password?: string;
  role?: string;
}): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const detail = errorBody?.detail || `Login failed with status ${res.status}`;
    throw new Error(detail);
  }

  return await res.json();
}

export async function fetchCurrentUser(token: string): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.detail || 'Session expired');
  }

  return await res.json();
}

export async function logoutUser(token?: string): Promise<void> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers,
    });
  } catch (err) {
    console.warn('Backend logout failed', err);
  }
}

// Live Routing & OpenRouteService API
export async function calculateRoute(payload: {
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  origin_name?: string;
  destination_name?: string;
}): Promise<RouteResponse> {
  const res = await fetch(`${API_BASE}/api/routes/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Route calculation failed' }));
    throw new Error(errData.detail || `Routing error (Status ${res.status})`);
  }

  return await res.json();
}

export async function searchLocations(query: string): Promise<LocationSearchResponse> {
  const res = await fetch(`${API_BASE}/api/routes/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(`Location search failed with status ${res.status}`);
  }
  return await res.json();
}

// Live GPS Traccar API
export async function fetchTraccarStatus(): Promise<TraccarStatusResponse> {
  const res = await fetch(`${API_BASE}/api/tracking/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch Traccar status (Status ${res.status})`);
  }
  return await res.json();
}

export async function fetchFleetTracking(userRole?: string): Promise<FleetTrackingResponse> {
  const headers: Record<string, string> = {};
  if (userRole) {
    headers['X-User-Role'] = userRole;
  }
  const res = await fetch(`${API_BASE}/api/tracking/vehicles`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch fleet tracking (Status ${res.status})`);
  }
  return await res.json();
}

// Dynamic Fleet CRUD API
export async function createBus(payload: {
  bus_number: string;
  capacity?: number;
  status?: string;
  initial_stop_id?: string;
  route_id?: string;
}, userRole?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userRole) headers['X-User-Role'] = userRole;
  const res = await fetch(`${API_BASE}/api/fleet`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create bus' }));
    throw new Error(err.detail || 'Failed to add bus');
  }
  return await res.json();
}

export async function updateBus(busId: string, payload: {
  bus_number?: string;
  capacity?: number;
  status?: string;
  current_stop_id?: string;
  route_id?: string;
}, userRole?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userRole) headers['X-User-Role'] = userRole;
  const res = await fetch(`${API_BASE}/api/fleet/${busId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update bus' }));
    throw new Error(err.detail || 'Failed to update bus');
  }
  return await res.json();
}

export async function updateBusStatus(busId: string, status: string, userRole?: string) {
  const headers: Record<string, string> = {};
  if (userRole) headers['X-User-Role'] = userRole;
  const res = await fetch(`${API_BASE}/api/fleet/${busId}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update status' }));
    throw new Error(err.detail || 'Failed to update bus status');
  }
  return await res.json();
}

// Dataset & Historical Events API
export async function fetchDatasetSummary() {
  const res = await fetch(`${API_BASE}/api/dataset/summary`);
  if (!res.ok) throw new Error('Failed to fetch dataset summary');
  return await res.json();
}

export async function triggerDatasetImport() {
  const res = await fetch(`${API_BASE}/api/dataset/import`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to import dataset');
  return await res.json();
}

// Event Management API
export async function fetchEvents() {
  const res = await fetch(`${API_BASE}/api/events`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return await res.json();
}

export async function createEvent(payload: {
  event_name: string;
  event_type: string;
  district: string;
  city_or_town: string;
  event_date: string;
  event_start_time?: string;
  event_end_time?: string;
  expected_attendance: number;
  actual_attendance?: number;
  bus_stand_id?: string;
}, userRole?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userRole) headers['X-User-Role'] = userRole;
  const res = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create event' }));
    throw new Error(err.detail || 'Failed to create event');
  }
  return await res.json();
}

export async function updateEventOccurrence(occurrenceId: string, payload: {
  expected_attendance?: number;
  user_observed_attendance?: number;
  event_start_time?: string;
  event_end_time?: string;
}, userRole?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userRole) headers['X-User-Role'] = userRole;
  const res = await fetch(`${API_BASE}/api/events/occurrences/${occurrenceId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update occurrence' }));
    throw new Error(err.detail || 'Failed to update occurrence');
  }
  return await res.json();
}

// User & Role Management API
export async function fetchUsers(userRole?: string) {
  const headers: Record<string, string> = {};
  if (userRole) headers['X-User-Role'] = userRole;
  const res = await fetch(`${API_BASE}/api/users`, { headers });
  if (!res.ok) throw new Error('Failed to fetch users');
  return await res.json();
}

export async function updateUserRole(userId: string, role: string, userRole?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userRole) headers['X-User-Role'] = userRole;
  const res = await fetch(`${API_BASE}/api/users/role`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ user_id: userId, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update role' }));
    throw new Error(err.detail || 'Failed to update role');
  }
  return await res.json();
}

// Live Weather (Open-Meteo) API Functions
export async function fetchCurrentWeather(locationName?: string, lat?: number, lng?: number) {
  const params = new URLSearchParams();
  if (locationName) params.append('location_name', locationName);
  if (lat !== undefined) params.append('lat', lat.toString());
  if (lng !== undefined) params.append('lng', lng.toString());

  const res = await fetch(`${API_BASE}/api/weather/current?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch weather status (${res.status})`);
  }
  return await res.json();
}

export async function fetchSupportedLocationsWeather() {
  const res = await fetch(`${API_BASE}/api/weather/supported-locations`);
  if (!res.ok) {
    throw new Error(`Failed to fetch supported locations weather (${res.status})`);
  }
  return await res.json();
}

// Event Manager Manual Crowd Observation API Functions
export async function createCrowdObservation(payload: {
  event_id: string;
  occurrence_id?: string;
  location: string;
  observed_count: number;
  observed_at: string;
  notes?: string;
  source?: string;
}, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/events/observations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit ground crowd observation' }));
    throw new Error(err.detail || `Observation submission failed with status ${res.status}`);
  }

  return await res.json();
}

export async function fetchCrowdObservations(eventId?: string, location?: string) {
  const params = new URLSearchParams();
  if (eventId) params.append('event_id', eventId);
  if (location) params.append('location', location);

  const res = await fetch(`${API_BASE}/api/events/observations?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch crowd observations (${res.status})`);
  }
  return await res.json();
}

export async function updateCrowdObservation(obsId: number, payload: {
  observed_count?: number;
  location?: string;
  observed_at?: string;
  notes?: string;
  source?: string;
}, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/events/observations/${obsId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to edit crowd observation' }));
    throw new Error(err.detail || `Observation update failed with status ${res.status}`);
  }

  return await res.json();
}

export async function deleteCrowdObservation(obsId: number, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/events/observations/${obsId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete observation' }));
    throw new Error(err.detail || `Observation deletion failed with status ${res.status}`);
  }

  return await res.json();
}

export async function fetchLatestEventObservation(eventId: string, location?: string) {
  const params = new URLSearchParams();
  if (location) params.append('location', location);

  const res = await fetch(`${API_BASE}/api/events/${eventId}/latest-observation?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch latest observation for event ${eventId}`);
  }
  return await res.json();
}



