import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { MapView } from './components/MapView';
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
import { DemoWorkflowStepper } from './components/DemoWorkflowStepper';
import { AllocationComparison } from './components/AllocationComparison';

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
  // API & System State
  const [apiStatus, setApiStatus] = useState({ healthy: false, message: 'Initializing...', is_demo: true });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Guided Demonstration Workflow Step
  const [demoStep, setDemoStep] = useState<number>(1);

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

  // Active View Tab
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

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
        runOptimization(scenarioParams),
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
        runOptimization(scenarioParams),
      ]);
      setForecast(forecastRes);
      setOptimization(optRes);
      setDemoStep(5);
    } catch (err) {
      console.error('Optimization run failed', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Step Select Handler
  const handleSelectDemoStep = (step: number) => {
    setDemoStep(step);
    switch (step) {
      case 1:
        setActiveTab('OVERVIEW');
        break;
      case 2:
        setActiveTab('FORECAST');
        break;
      case 3:
        setActiveTab('FORECAST');
        break;
      case 4:
        handleRunOptimization();
        break;
      case 5:
        setActiveTab('RIPPLEGUARD');
        break;
      case 6:
        setActiveTab('ALLOCATION');
        break;
      case 7:
        setActiveTab('ALLOCATION');
        break;
      default:
        setActiveTab('OVERVIEW');
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
    await approveTransfer(transferId, operatorId);
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
    await rejectTransfer(transferId, operatorId);
  };

  // What-If Simulation Runner
  const handleRunWhatIfSimulation = async (simParams: ScenarioParams): Promise<OptimizationResponse> => {
    return await runOptimization(simParams);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white flex flex-row w-full overflow-x-hidden">
      {/* Control Room Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        transferCount={optimization.transfers.length}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top Header */}
        <Header
          apiStatus={apiStatus}
          onRefresh={loadSystemData}
          isRefreshing={isRefreshing}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Dashboard Content */}
        <main className="p-4 md:p-6 space-y-6 flex-1 w-full max-w-[1600px] mx-auto">
          {/* Interactive Demonstration Stepper */}
          <DemoWorkflowStepper
            currentStep={demoStep}
            onSelectStep={handleSelectDemoStep}
            onRunOptimization={handleRunOptimization}
            isOptimizing={isOptimizing}
          />

          {/* Responsive 6-Card Operations Summary Metric Grid */}
          <MetricCards
            fleet={fleet}
            forecast={forecast}
            optimization={optimization}
            isOptimizing={isOptimizing}
          />

          {/* TAB 1: OVERVIEW (Master Control Operations) */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Scenario & Solver Controls */}
              <ScenarioControls
                params={scenarioParams}
                onChange={setScenarioParams}
                onRunOptimization={handleRunOptimization}
                isOptimizing={isOptimizing}
              />

              {/* Before vs After Bus Allocation Comparison */}
              <AllocationComparison
                stops={stops}
                fleet={fleet}
                optimization={optimization}
              />

              {/* 4-Stop Map & Bus Allocations */}
              <MapView
                stops={stops}
                fleet={fleet}
                transfers={optimization.transfers}
                forecast={forecast}
              />

              {/* Bus Allocation & Crowd-Risk Table */}
              <AllocationTable
                stops={stops}
                fleet={fleet}
                forecast={forecast}
                optimization={optimization}
              />

              {/* Transfer Recommendations */}
              <TransferCards transfers={optimization.transfers} />
            </div>
          )}

          {/* TAB 2: LIVE MAP / FLEET VIEW */}
          {activeTab === 'MAP' && (
            <div className="space-y-6">
              <MapView
                stops={stops}
                fleet={fleet}
                transfers={optimization.transfers}
                forecast={forecast}
              />
              <TransferCards transfers={optimization.transfers} />
              <FleetTimeline optimization={optimization} />
            </div>
          )}

          {/* TAB 3: DEMAND FORECAST */}
          {activeTab === 'FORECAST' && (
            <div className="space-y-6">
              <ForecastChart forecast={forecast} />
              <TimeToSurgeView
                scenarioName={scenarioParams.scenario_name}
                demandMultiplier={scenarioParams.demand_multiplier}
              />
            </div>
          )}

          {/* TAB 4: BUS ALLOCATION */}
          {activeTab === 'ALLOCATION' && (
            <div className="space-y-6">
              <AllocationComparison
                stops={stops}
                fleet={fleet}
                optimization={optimization}
              />
              <AllocationTable
                stops={stops}
                fleet={fleet}
                forecast={forecast}
                optimization={optimization}
              />
              <FleetTimeline optimization={optimization} />
              <ConstraintAudits
                validation={optimization.constraint_validation}
                solverName={optimization.solver_name}
                solveDurationMs={optimization.solve_duration_ms}
              />
            </div>
          )}

          {/* TAB 5: WHAT-IF SIMULATOR */}
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

          {/* TAB 6: RIPPLEGUARD TRANSFER LEDGER */}
          {activeTab === 'RIPPLEGUARD' && (
            <div className="space-y-6">
              <RippleGuardLedger
                transfers={optimization.transfers}
                scenarioName={scenarioParams.scenario_name}
                onApprove={handleApproveTransfer}
                onReject={handleRejectTransfer}
              />
              <ConstraintAudits
                validation={optimization.constraint_validation}
                solverName={optimization.solver_name}
                solveDurationMs={optimization.solve_duration_ms}
              />
            </div>
          )}

          {/* TAB 7: PASSENGER PORTAL */}
          {activeTab === 'PASSENGER' && (
            <div className="space-y-6">
              <PassengerView stops={stops} forecast={forecast} />
            </div>
          )}
        </main>

        {/* Control Room Footer */}
        <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
          <p>
            BusWise AI Transport Control Center • Fixed Fleet of 16 Buses • Google OR-Tools CBC MILP Solver • DEMO DATA — NOT LIVE
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
