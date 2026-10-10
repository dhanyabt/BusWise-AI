import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
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

import {
  fetchHealthStatus,
  fetchBusStops,
  fetchFleetSummary,
  fetchForecasts,
  runOptimization,
  approveTransfer,
  rejectTransfer,
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
      // Fallback to default operator
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
  const [mapMode, setMapMode] = useState<'GOOGLE' | 'GEOSPATIAL' | 'SCHEMATIC'>('GOOGLE');

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
    setOptimization((prev) => ({
      ...prev,
      transfers: prev.transfers.map((t) =>
        t.id === transferId
          ? {
            ...t,
            approval_status: 'APPROVED',
            approved_by: operatorId,
            approved_at: new Date().toISOString(),
          }
          : t
      ),
    }));
    await approveTransfer(transferId, operatorId, session.token);
  };

  // Operator Transfer Reject Action
  const handleRejectTransfer = async (transferId: string, operatorId: string) => {
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
    await rejectTransfer(transferId, operatorId, session.token);
  };

  // What-If Simulation Runner
  const handleRunWhatIfSimulation = async (simParams: ScenarioParams): Promise<OptimizationResponse> => {
    return await runOptimization(simParams, session.token);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-pink-500 selection:text-white flex flex-row w-full overflow-x-hidden">
      {/* Auth Modal for Role Selection */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(newSession) => setSession(newSession)}
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
          {/* TAB 1: COMPACT GOVERNMENT-GRADE DASHBOARD (Central Grid of Clickable Feature Cards) */}
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
                    onClick={() => setMapMode('GOOGLE')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                      mapMode === 'GOOGLE'
                        ? 'bg-pink-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Google Maps Platform (TN Corridor)
                  </button>
                  <button
                    onClick={() => setMapMode('GEOSPATIAL')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                      mapMode === 'GEOSPATIAL'
                        ? 'bg-pink-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    OpenStreetMap GIS + GPS
                  </button>
                  <button
                    onClick={() => setMapMode('SCHEMATIC')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                      mapMode === 'SCHEMATIC'
                        ? 'bg-pink-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Schematic Topology Canvas
                  </button>
                </div>
              </div>

              {mapMode === 'GOOGLE' ? (
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
              ) : mapMode === 'GEOSPATIAL' ? (
                <LeafletMapView
                  stops={stops}
                  fleet={fleet}
                  transfers={optimization.transfers}
                  forecast={forecast}
                  selectedOriginId={selectedRouteOrigin}
                  selectedDestinationId={selectedRouteDest}
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

          {/* TAB 3: FLEET & ROUTES */}
          {activeTab === 'FLEET' && (
            <div className="space-y-6">
              <MetricCards
                fleet={fleet}
                forecast={forecast}
                optimization={optimization}
                isOptimizing={isOptimizing}
              />
              <FleetTimeline optimization={optimization} />
              <AllocationTable
                stops={stops}
                fleet={fleet}
                forecast={forecast}
                optimization={optimization}
              />
            </div>
          )}

          {/* TAB 4: DEMAND FORECAST */}
          {activeTab === 'FORECAST' && (
            <div className="space-y-6">
              <ForecastChart forecast={forecast} />
              <TimeToSurgeView
                scenarioName={scenarioParams.scenario_name}
                demandMultiplier={scenarioParams.demand_multiplier}
              />
            </div>
          )}

          {/* TAB 5: AI OPTIMIZER (OR-TOOLS) */}
          {activeTab === 'OPTIMIZER' && (
            <div className="space-y-6">
              {/* Operational Risk Summary & Generative AI Trade-Off Explanation (Single view only) */}
              <AIExplainabilityCard forecast={forecast} optimization={optimization} />

              <AllocationComparison
                stops={stops}
                fleet={fleet}
                optimization={optimization}
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

          {/* TAB 6: WHAT-IF SIMULATOR */}
          {activeTab === 'SIMULATOR' && (
            <div className="space-y-6">
              <ScenarioControls
                params={scenarioParams}
                onChange={setScenarioParams}
                onRunOptimization={handleRunOptimization}
                isOptimizing={isOptimizing}
              />
              <WhatIfSimulator
                currentParams={scenarioParams}
                onSimulate={handleRunWhatIfSimulation}
              />
            </div>
          )}

          {/* TAB 7: TRIP PLANNER & TRIP TRACKER */}
          {activeTab === 'TRIP_PLANNER' && (
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

          {/* TAB 8: ALERTS & REPORTS */}
          {activeTab === 'ALERTS_REPORTS' && (
            <div className="space-y-6">
              <RippleGuardLedger
                transfers={optimization.transfers}
                scenarioName={scenarioParams.scenario_name}
                onApprove={handleApproveTransfer}
                onReject={handleRejectTransfer}
              />
              <TimeToSurgeView
                scenarioName={scenarioParams.scenario_name}
                demandMultiplier={scenarioParams.demand_multiplier}
              />
              <ConstraintAudits
                validation={optimization.constraint_validation}
                solverName={optimization.solver_name}
                solveDurationMs={optimization.solve_duration_ms}
              />
            </div>
          )}
        </main>

        {/* Control Room Footer */}
        <footer className="border-t border-slate-200 bg-white/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
          <p>
            BusWise AI Public Transport Control • Active Role: {session.role} ({session.name}) • Fixed Fleet of 16 Buses • Google OR-Tools CBC Solver • DEMO DATA — NOT LIVE
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
