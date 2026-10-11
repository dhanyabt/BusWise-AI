import React from 'react';
import { Sliders, Play, RotateCcw, CloudRain, Users, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import type { ScenarioParams } from '../types';

interface ScenarioControlsProps {
  params: ScenarioParams;
  onChange: (newParams: ScenarioParams) => void;
  onRunOptimization: () => void;
  onResetDemo?: () => void;
  isOptimizing: boolean;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  params,
  onChange,
  onRunOptimization,
  onResetDemo,
  isOptimizing,
}) => {
  // Scenario Preset Definitions (Deterministic Synthetic Data)
  const presets = [
    {
      id: 'normal_day',
      name: 'Normal Day',
      demand: 1.0,
      weather: 'Normal' as const,
      traffic: 0,
      closure: 'NONE',
      busDelayId: '',
      busDelayMins: 0,
      minService: 1,
      icon: Users,
      badgeColor: 'border-emerald-300 bg-emerald-50 text-emerald-800',
      description: 'Standard expected daily transit flow. Normal weather, no delays, all corridors open.',
    },
    {
      id: 'heavy_rain',
      name: 'Heavy Rain',
      demand: 1.3,
      weather: 'Severe' as const,
      traffic: 20,
      closure: 'NONE',
      busDelayId: '',
      busDelayMins: 0,
      minService: 1,
      icon: CloudRain,
      badgeColor: 'border-blue-300 bg-blue-50 text-blue-800',
      description: 'Torrential downpour. Travel times +50%, pedestrian walkability drops causing 30% hub surge.',
    },
    {
      id: 'festival_crowd',
      name: 'Festival Crowd',
      demand: 2.0,
      weather: 'Normal' as const,
      traffic: 15,
      closure: 'NONE',
      busDelayId: '',
      busDelayMins: 0,
      minService: 1,
      icon: Users,
      badgeColor: 'border-purple-300 bg-purple-50 text-purple-800',
      description: 'Concert & festival dispersal. Massive surge at CMBT (380 pax/15m) and Central (240 pax/15m).',
    },
    {
      id: 'traffic_congestion',
      name: 'Traffic Congestion',
      demand: 1.1,
      weather: 'Moderate' as const,
      traffic: 35,
      closure: 'NONE',
      busDelayId: '',
      busDelayMins: 0,
      minService: 1,
      icon: AlertTriangle,
      badgeColor: 'border-amber-300 bg-amber-50 text-amber-800',
      description: 'Severe arterial corridor gridlock. Bus travel times delayed by 35 minutes across routes.',
    },
    {
      id: 'bus_delay',
      name: 'Bus Delay',
      demand: 1.2,
      weather: 'Normal' as const,
      traffic: 10,
      closure: 'NONE',
      busDelayId: 'BUS-005',
      busDelayMins: 30,
      minService: 1,
      icon: Clock,
      badgeColor: 'border-orange-300 bg-orange-50 text-orange-800',
      description: 'Mechanical inspection for BUS-005 at Mylapore (30m delay). Bus unavailable during early intervals.',
    },
    {
      id: 'emergency_combined',
      name: 'Combined Emergency Scenario',
      demand: 2.2,
      weather: 'Severe' as const,
      traffic: 45,
      closure: 'STOP-001_STOP-004',
      busDelayId: 'BUS-010',
      busDelayMins: 40,
      minService: 2,
      icon: ShieldAlert,
      badgeColor: 'border-rose-300 bg-rose-50 text-rose-800',
      description: 'Torrential rain, 2.2x crowd surge, 45m traffic, road closure between CMBT & T. Nagar, and delayed bus BUS-010.',
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    onChange({
      ...params,
      scenario_name: p.id,
      demand_multiplier: p.demand,
      weather_severity: p.weather,
      traffic_delay_mins: p.traffic,
      road_closure: p.closure,
      bus_delay_id: p.busDelayId || undefined,
      bus_delay_mins: p.busDelayMins,
      min_service_level: p.minService,
    });
  };

  const handleReset = () => {
    const normal = presets[0];
    onChange({
      scenario_name: 'normal_day',
      demand_multiplier: normal.demand,
      weather_severity: normal.weather,
      traffic_delay_mins: normal.traffic,
      road_closure: normal.closure,
      bus_delay_id: undefined,
      bus_delay_mins: 0,
      min_service_level: 1,
      bus_capacity: 60,
      weight_queue: 10.0,
      weight_unmet: 100.0,
      weight_transfer: 5.0,
      stop_crowd_boost: undefined,
    });
    if (onResetDemo) {
      onResetDemo();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs mb-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Dynamic Fleet Allocation Scenarios</h2>
            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
              DEMO MODE — SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a predefined emergency scenario or adjust parameters to recalculate optimal multi-bus redistribution recommendations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all active:scale-95 border border-slate-200 cursor-pointer"
            title="Reset fleet distribution, scenarios, and delays to initial baseline"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={onRunOptimization}
            disabled={isOptimizing}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Recalculating Fleet Allocation...' : 'Run Scenario'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Selector Cards Grid (Requirement 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
        {presets.map((p) => {
          const Icon = p.icon;
          const isSelected = params.scenario_name === p.id || (p.id === 'normal_day' && params.scenario_name === 'baseline');
          return (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${p.badgeColor}`}>
                    {p.demand}x Demand
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{p.description}</p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Weather: <strong>{p.weather}</strong></span>
                <span>Traffic: <strong>+{p.traffic}m</strong></span>
                <span>Closure: <strong>{p.closure !== 'NONE' ? 'Active' : 'None'}</strong></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Manual Weather, Event, and Delay Inputs (Requirement 4) */}
      <div className="border-t border-slate-200 pt-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            Parametric Simulation Controls
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Active Scenario: <strong className="text-indigo-600">{params.scenario_name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Weather Severity Selector */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-500 text-[10px] uppercase block mb-1.5 font-bold">Weather Severity:</span>
            <div className="grid grid-cols-3 gap-1">
              {(['Normal', 'Moderate', 'Severe'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onChange({ ...params, weather_severity: lvl })}
                  className={`py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    (params.weather_severity || 'Normal') === lvl
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {params.weather_severity === 'Severe'
                ? '+50% travel time, +25% transit surge'
                : params.weather_severity === 'Moderate'
                ? '+25% travel time'
                : 'Standard road conditions'}
            </span>
          </div>

          {/* Crowd Multiplier Slider */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Crowd Multiplier:</span>
              <span className="text-indigo-700 font-bold text-xs">{params.demand_multiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={params.demand_multiplier}
              onChange={(e) => onChange({ ...params, demand_multiplier: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>1.0x Normal</span>
              <span>2.0x Peak</span>
              <span>3.0x Max Surge</span>
            </div>
          </div>

          {/* Traffic Delay Slider */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Traffic Delay:</span>
              <span className="text-amber-800 font-bold text-xs">+{params.traffic_delay_mins || 0} mins</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={params.traffic_delay_mins || 0}
              onChange={(e) => onChange({ ...params, traffic_delay_mins: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>0 min</span>
              <span>30 mins</span>
              <span>60 mins</span>
            </div>
          </div>

          {/* Road Closure Selector */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-500 text-[10px] uppercase block mb-1 font-bold">Road Closure:</span>
            <select
              value={params.road_closure || 'NONE'}
              onChange={(e) => onChange({ ...params, road_closure: e.target.value })}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="NONE">None — All Corridors Open</option>
              <option value="STOP-001_STOP-004">CMBT ↔ T. Nagar Closed</option>
              <option value="STOP-004_STOP-003">T. Nagar ↔ Central Closed</option>
              <option value="STOP-001_STOP-003">CMBT ↔ Central Closed</option>
              <option value="STOP-002_STOP-001">Mylapore ↔ CMBT Closed</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {params.road_closure && params.road_closure !== 'NONE'
                ? 'Detour routing activated'
                : 'Direct travel corridors active'}
            </span>
          </div>

          {/* Bus Delay Selector (Bus ID & Duration) */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl sm:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1">
                <span className="text-slate-500 text-[10px] uppercase block mb-1 font-bold">Simulate Bus Delay (ID):</span>
                <select
                  value={params.bus_delay_id || ''}
                  onChange={(e) => onChange({ ...params, bus_delay_id: e.target.value || undefined })}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">No bus delay active</option>
                  {Array.from({ length: 16 }, (_, i) => {
                    const id = `BUS-${String(i + 1).padStart(3, '0')}`;
                    return (
                      <option key={id} value={id}>
                        {id} (BW-{100 + i + 1})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Delay Duration:</span>
                  <span className="font-bold text-orange-700">{params.bus_delay_mins || 0} mins</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={params.bus_delay_mins || 0}
                  onChange={(e) => onChange({ ...params, bus_delay_mins: parseInt(e.target.value, 10) })}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Event Crowd Boost per Stop */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl sm:col-span-2">
            <span className="text-slate-500 text-[10px] uppercase block mb-1 font-bold">Event Crowd Surge Boost (per Stop):</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'STOP-001', name: 'CMBT' },
                { id: 'STOP-002', name: 'Mylapore' },
                { id: 'STOP-003', name: 'Central' },
                { id: 'STOP-004', name: 'T. Nagar' },
              ].map((st) => {
                const currentBoost = (params.stop_crowd_boost || {})[st.id] || 0;
                return (
                  <div key={st.id} className="bg-white border border-slate-200 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-600 font-bold block">{st.name}</span>
                    <select
                      value={currentBoost}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        const updated = { ...(params.stop_crowd_boost || {}), [st.id]: val };
                        onChange({ ...params, stop_crowd_boost: updated });
                      }}
                      className="mt-1 w-full text-center bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-indigo-700"
                    >
                      <option value={0}>+0 pax</option>
                      <option value={50}>+50 pax</option>
                      <option value={100}>+100 pax</option>
                      <option value={150}>+150 pax</option>
                      <option value={200}>+200 pax</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
