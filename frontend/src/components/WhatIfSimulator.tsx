import React, { useState } from 'react';
import { Sliders, Play, CheckCircle } from 'lucide-react';
import type { ScenarioParams, OptimizationResponse } from '../types';

interface WhatIfSimulatorProps {
  currentParams: ScenarioParams;
  onSimulate: (newParams: ScenarioParams) => Promise<OptimizationResponse>;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ currentParams, onSimulate }) => {
  const [simParams, setSimParams] = useState<ScenarioParams>({ ...currentParams });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<OptimizationResponse | null>(null);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await onSimulate(simParams);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">What-If Interactive Scenario Simulator</h2>
            <span className="text-[10px] bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded font-mono font-semibold">
              Hypothetical Stress Testing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify festival attendance, concert end times, bus capacities, and traffic delays to simulate OR-Tools allocation outcomes.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Simulating OR-Tools Solver...' : 'Run What-If Simulation'}</span>
        </button>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5 font-mono text-xs">
        {/* Demand Multiplier */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <label className="text-slate-600 text-[10px] block font-bold uppercase mb-1">
            Expected Attendance: <span className="text-pink-700">{simParams.demand_multiplier}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={simParams.demand_multiplier}
            onChange={(e) => setSimParams({ ...simParams, demand_multiplier: parseFloat(e.target.value) })}
            className="w-full accent-pink-600 cursor-pointer"
          />
        </div>

        {/* Bus Capacity */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <label className="text-slate-600 text-[10px] block font-bold uppercase mb-1">
            Bus Capacity: <span className="text-pink-700">{simParams.bus_capacity} pax/bus</span>
          </label>
          <input
            type="range"
            min="40"
            max="80"
            step="5"
            value={simParams.bus_capacity}
            onChange={(e) => setSimParams({ ...simParams, bus_capacity: parseInt(e.target.value, 10) })}
            className="w-full accent-pink-600 cursor-pointer"
          />
        </div>

        {/* Minimum Service Level */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <label className="text-slate-600 text-[10px] block font-bold uppercase mb-1">
            Min Service Setting: <span className="text-amber-700">{simParams.min_service_level} Bus/stop</span>
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="1"
            value={simParams.min_service_level}
            onChange={(e) => setSimParams({ ...simParams, min_service_level: parseInt(e.target.value, 10) })}
            className="w-full accent-pink-600 cursor-pointer"
          />
        </div>

        {/* Queue Penalty Weight */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <label className="text-slate-600 text-[10px] block font-bold uppercase mb-1">
            Queue Wait Penalty: <span className="text-emerald-700">W_q = {simParams.weight_queue}</span>
          </label>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={simParams.weight_queue}
            onChange={(e) => setSimParams({ ...simParams, weight_queue: parseFloat(e.target.value) })}
            className="w-full accent-pink-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Simulation Results Side-by-Side Comparison */}
      {simResult && (
        <div className="border-t border-slate-200 pt-4 mt-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Simulation Comparison vs Baseline</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Solver Status */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-slate-500 text-[10px] block uppercase font-medium">SOLVER STATUS</span>
              <span className="text-sm font-bold text-emerald-700">{simResult.solver_status}</span>
              <span className="text-[10px] text-slate-500 block mt-1">{simResult.solver_name}</span>
            </div>

            {/* Recommended Transfers */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-slate-500 text-[10px] block uppercase font-medium">SIMULATED TRANSFERS</span>
              <span className="text-sm font-bold text-pink-700">{simResult.transfers.length} Bus Movements</span>
              <span className="text-[10px] text-slate-500 block mt-1">Solves in {simResult.solve_duration_ms}ms</span>
            </div>

            {/* Unmet Demand */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-slate-500 text-[10px] block uppercase font-medium">REMAINING UNMET DEMAND</span>
              <span className={`text-sm font-bold ${simResult.total_unmet_demand > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {simResult.total_unmet_demand} pax
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Across 2-hour planning horizon</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
