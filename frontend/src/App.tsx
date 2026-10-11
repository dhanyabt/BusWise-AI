import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import { MapView } from './components/MapView';
import { LeafletMapView } from './components/LeafletMapView';
import { GoogleMapView } from './components/GoogleMapView';
import { ForecastChart } from './components/ForecastChart';
import { TransferCards } from './components/TransferCards';
import { FleetTimeline } from './components/FleetTimeline';
import { ScenarioControls } from './components/ScenarioControls';
import { ConstraintAudits } from './components/ConstraintAudits';
import { RippleGuardLedger } from './components/RippleGuardLedger';
import { TimeToSurgeView } from './components/TimeToSurgeView';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { PassengerView } from './components/PassengerView';
import { AllocationTable } from './components/AllocationTable';
import { AllocationComparison } from './components/AllocationComparison';
import { AuthModal } from './components/AuthModal';
import type { UserSession } from './components/AuthModal';
import { TripPlanner } from './components/TripPlanner';
import { AIExplainabilityCard } from './components/AIExplainabilityCard';
import { DashboardGrid } from './components/DashboardGrid';
import { FleetManagementView } from './components/FleetManagementView';
import { EventManagementView } from './components/EventManagementView';
import { UserManagementView } from './components/UserManagementView';

import {
  fetchHealthStatus,
  fetchBusStops,
  fetchFleetSummary,
  fetchForecasts,
  runOptimization,
  approveTransfer,
  rejectTransfer,
  arriveTransfer,
  resetDemoFleet,
} from './services/api';

import { realtimeService } from './services/realtime';

import type {
  BusStop,
  FleetSummary,
  ForecastResponse,
  OptimizationResponse,
  ScenarioParams,
} from './types';

import {
  DEMO_STOPS_DATA,
  DEMO_FLEET_DATA,
  DEMO_FORECAST_DATA,
  DEMO_OPTIMIZATION_DATA,
} from './data/demoData';

export const App: React.FC = () => {
  // User Authentication & Session State (Persisted in localStorage)
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('buswise_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token && parsed.role) return parsed;
      }
    } catch {
      // Fallback
    }
    return {
      id: 'usr-002',
      name: 'Cmdr. Sarah Vance',
      email: 'officer@buswise.ai',
      role: 'OFFICER',
      agency: 'Tamil Nadu State Transport Corporation',
      badge_number: 'TNSTC-8092',
      token: 'token-officer-67890',
    };
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // API & System State
  const [apiStatus, setApiStatus] = useState({ healthy: false, message: 'Initializing...', is_demo: true });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Map Engine Mode (Google Maps vs Leaflet OSM vs Schematic Canvas)
  const [mapMode, setMapMode] = useState<'GOOGLE' | 'GEOSPATIAL' | 'SCHEMATIC'>('GEOSPATIAL');

  // Passenger Selected Route
  const [selectedRouteOrigin, setSelectedRouteOrigin] = useState<string>('STOP-001');
  const [selectedRouteDest, setSelectedRouteDest] = useState<string>('STOP-003');

  // Core Data States
  const [stops, setStops] = useState<BusStop[]>(DEMO_STOPS_DATA);
  const [fleet, setFleet] = useState<FleetSummary>(DEMO_FLEET_DATA);
  const [forecast, setForecast] = useState<ForecastResponse>(DEMO_FORECAST_DATA);
  const [optimization, setOptimization] = useState<OptimizationResponse>(DEMO_OPTIMIZATION_DATA);

  // Active Scenario Controls
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    scenario_name: 'baseline',
    demand_multiplier: 1.0,
    min_service_level: 1,
    bus_capacity: 60,
    weight_queue: 10.0,
    weight_unmet: 100.0,
    weight_transfer: 5.0,
  });

  // Active View Tab (Defaults to compact government-grade DASHBOARD)
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');

  // Load Initial System Data
  const loadSystemData = async () => {
    setIsRefreshing(true);
    try {
      const health = await fetchHealthStatus();
      setApiStatus(health);

      const [stopsRes, fleetRes, forecastRes, optRes] = await Promise.all([
        fetchBusStops(),
        fetchFleetSummary(),
        fetchForecasts(scenarioParams.scenario_name, scenarioParams.demand_multiplier),
        runOptimization(scenarioParams, session.token),
      ]);

      setStops(stopsRes.stops);
      setFleet(fleetRes);
      setForecast(forecastRes);
      setOptimization(optRes);
    } catch (err) {
      console.warn('Using local fallback demo data');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSystemData();

    const unsubscribe = realtimeService.subscribe('heartbeat', () => {
      // Realtime active
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle Optimization Trigger
  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    try {
      const [forecastRes, optRes] = await Promise.all([
        fetchForecasts(scenarioParams.scenario_name, scenarioParams.demand_multiplier),
        runOptimization(scenarioParams, session.token),
      ]);
      setForecast(forecastRes);
      setOptimization(optRes);
    } catch (err) {
      console.error('Optimization run failed', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Operator Transfer Approval Action
  const handleApproveTransfer = async (transferId: string, operatorId: string) => {
    // 1. Locate transfer recommendation
    const targetTransfer = optimization.transfers.find((t) => t.id === transferId);
    if (!targetTransfer) {
      throw new Error(`Transfer recommendation '${transferId}' not found.`);
    }

    const currentStatus = (targetTransfer.approval_status || 'RECOMMENDED').toUpperCase();
    if (currentStatus !== 'RECOMMENDED') {
      throw new Error(`Transfer '${transferId}' cannot be approved because its current status is '${currentStatus}'.`);
    }

    const originStopId = targetTransfer.origin_stop_id;
    const destStopId = targetTransfer.destination_stop_id;
    const busCount = targetTransfer.bus_count || 1;

    // 2. Feasibility & Conservation Validation
    const originStopData = stops.find((s) => s.id === originStopId);
    const minServiceLevel = originStopData?.minimum_service_level ?? 1;

    const currentOriginDistribution = fleet.distribution_by_stop.find((d) => d.stop_id === originStopId);
    const originBusCount = currentOriginDistribution ? currentOriginDistribution.bus_count : 0;

    if (originBusCount - busCount < minServiceLevel) {
      throw new Error(
        `Feasibility Violation: Approving transfer would reduce available fleet at ${targetTransfer.origin_stop_name} from ${originBusCount} to ${
          originBusCount - busCount
        }, violating minimum service requirement of ${minServiceLevel} bus.`
      );
    }

    // Check available buses
    const availableBusesAtOrigin = fleet.buses.filter(
      (b) => b.status === 'AVAILABLE' && (b.current_stop_id === originStopId || b.initial_stop_id === originStopId || !b.current_stop_id)
    );

    if (availableBusesAtOrigin.length < busCount && originBusCount < busCount) {
      throw new Error(
        `Fleet Error: Only ${availableBusesAtOrigin.length} available buses at ${targetTransfer.origin_stop_name}, but ${busCount} requested.`
      );
    }

    // Select buses to dispatch
    const preferredBus = availableBusesAtOrigin.find((b) => b.id === targetTransfer.bus_id);
    const busesToDispatch = preferredBus ? [preferredBus.id] : availableBusesAtOrigin.slice(0, busCount).map((b) => b.id);

    // 3. Update Shared Application State (Dispatch / Traveling)
    // Deduct bus_count from origin stop available count; do NOT add to destination count until arrival.
    setFleet((prevFleet) => {
      const updatedDistribution = prevFleet.distribution_by_stop.map((d) => {
        if (d.stop_id === originStopId) {
          return { ...d, bus_count: Math.max(0, d.bus_count - busCount) };
        }
        return d;
      });

      const updatedBuses = prevFleet.buses.map((b) => {
        if (busesToDispatch.includes(b.id)) {
          return {
            ...b,
            status: 'TRAVELING' as const,
            current_stop_id: undefined,
            destination_stop_id: destStopId,
            assigned_service: targetTransfer.id,
            eta_minutes: targetTransfer.travel_time_mins || 15,
            route_id: `ROUTE-${originStopId}-${destStopId}`,
          };
        }
        return b;
      });

      const newAvailableBuses = Math.max(0, prevFleet.available_buses - busCount);
      const newInServiceBuses = prevFleet.in_service_buses + busCount;

      return {
        ...prevFleet,
        available_fleet: newAvailableBuses,
        available_buses: newAvailableBuses,
        in_service_buses: newInServiceBuses,
        distribution_by_stop: updatedDistribution,
        buses: updatedBuses,
      };
    });

    // Update transfer status to TRAVELING
    setOptimization((prev) => ({
      ...prev,
      transfers: prev.transfers.map((t) =>
        t.id === transferId
          ? {
              ...t,
              approval_status: 'TRAVELING',
              approved_by: operatorId,
              approved_at: new Date().toISOString(),
            }
          : t
      ),
    }));

    // 4. API Call if backend endpoint is available
    try {
      await approveTransfer(transferId, operatorId, session.token);
    } catch (err) {
      console.warn('Backend API notification:', err);
    }
  };

  // Operator Transfer Reject Action
  const handleRejectTransfer = async (transferId: string, operatorId: string) => {
    const targetTransfer = optimization.transfers.find((t) => t.id === transferId);
    if (targetTransfer) {
      const currentStatus = (targetTransfer.approval_status || 'RECOMMENDED').toUpperCase();
      if (currentStatus !== 'RECOMMENDED') {
        throw new Error(`Transfer '${transferId}' cannot be rejected because it is currently '${currentStatus}'.`);
      }
    }

    setOptimization((prev) => ({
      ...prev,
      transfers: prev.transfers.map((t) =>
        t.id === transferId
          ? {
              ...t,
              approval_status: 'REJECTED',
              approved_by: operatorId,
              approved_at: new Date().toISOString(),
            }
          : t
      ),
    }));

    try {
      await rejectTransfer(transferId, operatorId, session.token);
    } catch (err) {
      console.warn('Backend reject API notification:', err);
    }
  };

  // Fast-Forward / Simulated Vehicle Arrival Handler
  const handleSimulateArrival = async (transferId: string) => {
    const targetTransfer = optimization.transfers.find((t) => t.id === transferId);
    if (!targetTransfer) return;

    const destStopId = targetTransfer.destination_stop_id;
    const busCount = targetTransfer.bus_count || 1;

    // Move bus into destination stop available fleet count upon arrival
    setFleet((prevFleet) => {
      const updatedDistribution = prevFleet.distribution_by_stop.map((d) => {
        if (d.stop_id === destStopId) {
          return { ...d, bus_count: d.bus_count + busCount };
        }
        return d;
      });

      let convertedCount = 0;
      const updatedBuses = prevFleet.buses.map((b) => {
        const isThisTransferBus =
          b.assigned_service === targetTransfer.id ||
          b.id === targetTransfer.bus_id ||
          b.status === 'TRAVELING' ||
          b.status === 'IN_SERVICE';

        if (isThisTransferBus && convertedCount < busCount) {
          convertedCount++;
          return {
            ...b,
            status: 'AVAILABLE' as const,
            current_stop_id: destStopId,
            destination_stop_id: undefined,
            assigned_service: undefined,
            eta_minutes: 0,
          };
        }
        return b;
      });

      const newAvailable = prevFleet.available_buses + busCount;
      const newInService = Math.max(0, prevFleet.in_service_buses - busCount);

      return {
        ...prevFleet,
        available_fleet: newAvailable,
        available_buses: newAvailable,
        in_service_buses: newInService,
        distribution_by_stop: updatedDistribution,
        buses: updatedBuses,
      };
    });

    setOptimization((prev) => ({
      ...prev,
      transfers: prev.transfers.map((t) =>
        t.id === transferId
          ? {
              ...t,
              approval_status: 'ARRIVED',
            }
          : t
      ),
    }));

    try {
      await arriveTransfer(transferId, session.token);
    } catch (err) {
      console.warn('Backend arrival API notification:', err);
    }
  };

  // Reset Demo handler restoring initial 16-bus baseline state
  const handleResetDemo = async () => {
    setIsRefreshing(true);
    try {
      await resetDemoFleet();
    } catch (err) {
      console.warn('Reset demo backend error', err);
    }

    const defaultParams: ScenarioParams = {
      scenario_name: 'normal_day',
      demand_multiplier: 1.0,
      min_service_level: 1,
      bus_capacity: 60,
      weight_queue: 10.0,
      weight_unmet: 100.0,
      weight_transfer: 5.0,
      weather_severity: 'Normal',
      traffic_delay_mins: 0,
      road_closure: 'NONE',
      bus_delay_id: undefined,
      bus_delay_mins: 0,
      stop_crowd_boost: undefined,
    };
    setScenarioParams(defaultParams);

    try {
      const [fleetRes, forecastRes, optRes] = await Promise.all([
        fetchFleetSummary(),
        fetchForecasts('normal_day', 1.0),
        runOptimization(defaultParams, session.token),
      ]);
      setFleet(fleetRes);
      setForecast(forecastRes);
      setOptimization(optRes);
    } catch (err) {
      console.warn('Data reload error after reset', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // What-If Simulation Runner
  const handleRunWhatIfSimulation = async (simParams: ScenarioParams): Promise<OptimizationResponse> => {
    return await runOptimization(simParams, session.token);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-500 selection:text-white flex flex-row w-full overflow-x-hidden">
      {/* Auth Modal for Role Selection */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          localStorage.setItem('buswise_session', JSON.stringify(newSession));
        }}
        currentRole={session.role}
      />

      {/* Control Room Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        transferCount={optimization.transfers.length}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        session={session}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top Header */}
        <Header
          apiStatus={apiStatus}
          onRefresh={loadSystemData}
          isRefreshing={isRefreshing}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          session={session}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Main Workspace Content */}
        <main className="p-4 md:p-6 space-y-5 flex-1 w-full max-w-[1600px] mx-auto">
          {/* TAB 1: COMPACT GOVERNMENT-GRADE DASHBOARD */}
          {activeTab === 'DASHBOARD' && (
            <DashboardGrid
              fleet={fleet}
              forecast={forecast}
              optimization={optimization}
              session={session}
              onNavigate={setActiveTab}
              isOptimizing={isOptimizing}
              onRunOptimization={handleRunOptimization}
            />
          )}

          {/* TAB 2: LIVE MAP & TAMIL NADU GIS INTEGRATION */}
          {activeTab === 'MAP' && (
            <div className="space-y-4">
              {/* Map Engine Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200/90 p-3 rounded-xl shadow-2xs font-mono text-xs">
                <span className="text-slate-800 font-bold">Select Map Display Engine:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setMapMode('GEOSPATIAL')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                      mapMode === 'GEOSPATIAL'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    OpenStreetMap GIS + ORS + GPS
                  </button>
                  <button
                    onClick={() => setMapMode('GOOGLE')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                      mapMode === 'GOOGLE'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Google Maps Platform (TN Corridor)
                  </button>
                  <button
                    onClick={() => setMapMode('SCHEMATIC')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                      mapMode === 'SCHEMATIC'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Schematic Topology Canvas
                  </button>
                </div>
              </div>

              {mapMode === 'GEOSPATIAL' ? (
                <LeafletMapView
                  stops={stops}
                  fleet={fleet}
                  transfers={optimization.transfers}
                  forecast={forecast}
                  selectedOriginId={selectedRouteOrigin}
                  selectedDestinationId={selectedRouteDest}
                  userRole={session.role}
                />
              ) : mapMode === 'GOOGLE' ? (
                <GoogleMapView
                  stops={stops}
                  fleet={fleet}
                  transfers={optimization.transfers}
                  forecast={forecast}
                  selectedOriginId={selectedRouteOrigin}
                  selectedDestinationId={selectedRouteDest}
                  onSelectRoute={(o, d) => {
                    setSelectedRouteOrigin(o);
                    setSelectedRouteDest(d);
                  }}
                  userRole={session.role}
                />
              ) : (
                <MapView
                  stops={stops}
                  fleet={fleet}
                  transfers={optimization.transfers}
                  forecast={forecast}
                />
              )}
            </div>
          )}

          {/* TAB 3: FLEET MANAGEMENT */}
          {activeTab === 'FLEET' && (
            <FleetManagementView
              fleet={fleet}
              session={session}
              onRefreshFleet={loadSystemData}
            />
          )}

          {/* TAB 4: EVENT MANAGEMENT */}
          {activeTab === 'EVENTS' && (
            <EventManagementView session={session} />
          )}

          {/* TAB 5: CROWD RISK */}
          {activeTab === 'CROWD_RISK' && (
            <div className="space-y-6">
              <TimeToSurgeView
                scenarioName={scenarioParams.scenario_name}
                demandMultiplier={scenarioParams.demand_multiplier}
              />
              <ForecastChart forecast={forecast} />
            </div>
          )}

          {/* TAB 6: DEMAND FORECAST */}
          {activeTab === 'DEMAND_FORECAST' && (
            <div className="space-y-6">
              <ForecastChart forecast={forecast} />
              <FleetTimeline optimization={optimization} />
            </div>
          )}

          {/* TAB 7: AI OPTIMIZER (OR-TOOLS) */}
          {activeTab === 'OPTIMIZER' && (
            <div className="space-y-6">
              <AIExplainabilityCard forecast={forecast} optimization={optimization} />
              <AllocationComparison
                transfers={optimization.transfers}
                onApprove={handleApproveTransfer}
                onReject={handleRejectTransfer}
                onSimulateArrival={handleSimulateArrival}
              />
              <TransferCards transfers={optimization.transfers} />
              <AllocationTable
                stops={stops}
                fleet={fleet}
                forecast={forecast}
                optimization={optimization}
              />
              <ConstraintAudits
                validation={optimization.constraint_validation}
                solverName={optimization.solver_name}
                solveDurationMs={optimization.solve_duration_ms}
              />
            </div>
          )}

          {/* TAB 8: WHAT-IF SIMULATOR */}
          {activeTab === 'SIMULATOR' && (
            <div className="space-y-6">
              <ScenarioControls
                params={scenarioParams}
                onChange={setScenarioParams}
                onRunOptimization={handleRunOptimization}
                onResetDemo={handleResetDemo}
                isOptimizing={isOptimizing}
              />
              <WhatIfSimulator
                currentParams={scenarioParams}
                onSimulate={handleRunWhatIfSimulation}
              />
            </div>
          )}

          {/* TAB 9: ALLOCATION LEDGER */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-6">
              <ScenarioControls
                params={scenarioParams}
                onChange={setScenarioParams}
                onRunOptimization={handleRunOptimization}
                onResetDemo={handleResetDemo}
                isOptimizing={isOptimizing}
              />
              <RippleGuardLedger
                transfers={optimization.transfers}
                scenarioName={scenarioParams.scenario_name}
                fleet={fleet}
                stopTimelines={optimization.stop_timelines}
                onApprove={handleApproveTransfer}
                onReject={handleRejectTransfer}
                onSimulateArrival={handleSimulateArrival}
              />
              <ConstraintAudits
                validation={optimization.constraint_validation}
                solverName={optimization.solver_name}
                solveDurationMs={optimization.solve_duration_ms}
              />
            </div>
          )}

          {/* TAB 10: PASSENGER PORTAL */}
          {activeTab === 'PASSENGER' && (
            <div className="space-y-6">
              <TripPlanner
                stops={stops}
                forecast={forecast}
                onSelectRoute={(o, d) => {
                  setSelectedRouteOrigin(o);
                  setSelectedRouteDest(d);
                }}
              />
              <PassengerView stops={stops} forecast={forecast} />
            </div>
          )}

          {/* TAB 11: USER & ROLE MANAGEMENT */}
          {activeTab === 'USERS' && (
            <UserManagementView session={session} />
          )}
        </main>

        {/* Control Room Footer */}
        <footer className="border-t border-slate-200 bg-white/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
          <p>
            BusWise AI Public Transport Control • Active Role: {session.role} ({session.name}) • Dynamic Fleet: {fleet.registered_fleet} Registered ({fleet.available_fleet} Available) • Google OR-Tools CBC Solver
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
