import React from 'react';
import { Sliders, Play } from 'lucide-react';
import type { ScenarioParams } from '../types';

interface ScenarioControlsProps {
  params: ScenarioParams;
  onChange: (newParams: ScenarioParams) => void;
  onRunOptimization: () => void;
  isOptimizing: boolean;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  params,
  onChange,
  onRunOptimization,
  isOptimizing,
}) => {
  const handlePresetSelect = (name: string, mult: number, minServ: number) => {
    onChange({
      ...params,
      scenario_name: name,
      demand_multiplier: mult,
      min_service_level: minServ,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur mb-6">

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Scenario & Solver Controls</h2>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
              Live Simulation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test custom festival crowd surges, minimum-service constraints, and adjust OR-Tools optimizer penalty weights.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'Solving MILP Model...' : 'Run OR-Tools Optimizer'}</span>
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
        <button
          onClick={() => handlePresetSelect('baseline', 1.0, 1)}
          className={`p-3 rounded-xl border text-left transition-all font-mono text-xs ${params.scenario_name === 'baseline'
            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
        >
          <span className="font-bold text-white block">Baseline Festival Flow</span>
          <span className="text-[11px] block mt-0.5 opacity-80">1.0x Demand • Min 1 Bus/Stop</span>
        </button>

        <button
          onClick={() => handlePresetSelect('high_peak', 1.6, 2)}
          className={`p-3 rounded-xl border text-left transition-all font-mono text-xs ${params.scenario_name === 'high_peak'
            ? 'bg-amber-500/10 border-amber-500 text-amber-300'
            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
        >
          <span className="font-bold text-white block">Headliner Exit (High Peak)</span>
          <span className="text-[11px] block mt-0.5 opacity-80">1.6x Surge • Min 2 Buses/Stop</span>
        </button>

        <button
          onClick={() => handlePresetSelect('low_demand', 0.6, 1)}
          className={`p-3 rounded-xl border text-left transition-all font-mono text-xs ${params.scenario_name === 'low_demand'
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
        >
          <span className="font-bold text-white block">Afternoon Off-Peak</span>
          <span className="text-[11px] block mt-0.5 opacity-80">0.6x Volume • Min 1 Bus/Stop</span>
        </button>
      </div>

      {/* Interactive Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 border-t border-slate-800 pt-4 text-xs font-mono">

        {/* Demand Multiplier Slider */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Demand Multiplier:</span>
            <span className="font-bold text-indigo-400">{params.demand_multiplier}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={params.demand_multiplier}
            onChange={(e) => onChange({ ...params, demand_multiplier: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* Minimum Service Level Selector */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Min Service Level:</span>
            <span className="font-bold text-amber-400">{params.min_service_level} Bus/stop</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="1"
            value={params.min_service_level}
            onChange={(e) => onChange({ ...params, min_service_level: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Queue Penalty Weight */}
        <div>
          <div className="flex justify-between text-slate-300 mb-1">
            <span>Queue Wait Penalty:</span>
            <span className="font-bold text-purple-400">W_q = {params.weight_queue}</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={params.weight_queue}
            onChange={(e) => onChange({ ...params, weight_queue: parseFloat(e.target.value) })}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

      </div>

    </div>
  );
};
