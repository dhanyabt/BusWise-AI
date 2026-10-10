import type {
  BusStop,
  FleetSummary,
  ForecastResponse,
  OptimizationResponse,
  ScenarioParams,
  TransferCard,
  UserSession,
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
