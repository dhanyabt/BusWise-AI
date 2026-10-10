import React from 'react';
import { Bus, MapPin, Users, TrendingUp, AlertTriangle, Cpu, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { FleetSummary, ForecastResponse, OptimizationResponse } from '../types';

interface MetricCardsProps {
  fleet: FleetSummary;
  forecast: ForecastResponse;
  optimization: OptimizationResponse;
  isOptimizing?: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  fleet,
  forecast,
  optimization,
  isOptimizing = false,
}) => {
  const totalQueue = forecast.stops_forecast.reduce((sum, s) => sum + s.initial_queue, 0);
  const total2hArrivals = forecast.stops_forecast.reduce((sum, s) => sum + s.total_2h_arrivals, 0);

  const criticalStops = forecast.stops_forecast.filter((s) =>
    s.intervals.some((i) => i.risk_level === 'CRITICAL' || i.risk_level === 'HIGH')
  );
  const criticalStopsCount = criticalStops.length;

  // Identify next highest demand surge stop and interval
  let maxArrivalStop = forecast.stops_forecast[0];
  let maxArrivalVal = 0;
  let peakIntervalIndex = 0;

  forecast.stops_forecast.forEach((sf) => {
    sf.intervals.forEach((interval) => {
      if (interval.arrivals > maxArrivalVal) {
        maxArrivalVal = interval.arrivals;
        maxArrivalStop = sf;
        peakIntervalIndex = interval.interval_index;
      }
    });
  });

  const nextSurgeText = maxArrivalStop
    ? `${maxArrivalStop.stop_name} @ T+${peakIntervalIndex * 15}m (${maxArrivalVal} pax)`
    : 'None projected';

  // Status formatting for solver states
  const getStatusBadge = () => {
    if (isOptimizing) {
      return {
        label: 'SOLVING...',
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10 border-indigo-500/30',
        sub: 'OR-Tools CBC Processing',
        icon: <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />,
      };
    }

    const status = optimization.solver_status ? optimization.solver_status.toUpperCase() : 'READY';

    switch (status) {
      case 'OPTIMAL':
        return {
          label: 'OPTIMAL',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          sub: `${optimization.transfers.length} Transfers (${optimization.solve_duration_ms}ms)`,
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        };
      case 'FEASIBLE':
        return {
          label: 'FEASIBLE',
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/30',
          sub: `${optimization.transfers.length} Transfers (${optimization.solve_duration_ms}ms)`,
          icon: <Cpu className="w-4 h-4 text-cyan-400" />,
        };
      case 'INFEASIBLE':
        return {
          label: 'INFEASIBLE',
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/30',
          sub: 'Fleet constraints binding',
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
        };
      case 'UNAVAILABLE':
        return {
          label: 'UNAVAILABLE',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          sub: 'Fallback simulation active',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      default:
        return {
          label: 'READY',
          color: 'text-slate-300',
          bg: 'bg-slate-800 border-slate-700',
          sub: 'Click Run Optimizer',
          icon: <Cpu className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Fleet */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Fleet</span>
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Bus className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-white font-mono">{fleet.total_buses} Buses</span>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">100% Fleet Conserved</p>
        </div>
      </div>

      {/* 2. Bus Stops */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Bus Stops</span>
          <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-white font-mono">4 Stops</span>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Festival Transport Grid</p>
        </div>
      </div>

      {/* 3. Initial Passenger Queue */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Initial Queue</span>
          <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-white font-mono">{totalQueue} pax</span>
          <p className="text-[10px] text-purple-300 mt-0.5 font-mono">Peak: Main Stand (120)</p>
        </div>
      </div>

      {/* 4. Predicted Passenger Demand */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Predicted 2h Demand</span>
          <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-white font-mono">{total2hArrivals} pax</span>
          <p className="text-[10px] text-cyan-300 mt-0.5 font-mono">MAE: {forecast.evaluation_mae} pax</p>
        </div>
      </div>

      {/* 5. Next Surge Prediction */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Next Demand Surge</span>
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs font-bold text-amber-300 font-mono block truncate" title={nextSurgeText}>
            {nextSurgeText}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
            {criticalStopsCount} / 4 Stops High Risk
          </p>
        </div>
      </div>

      {/* 6. Optimization Status & Result State */}
      <div className={`bg-slate-900/90 border rounded-xl p-3.5 shadow-lg backdrop-blur flex flex-col justify-between ${statusInfo.bg}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Optimizer Status</span>
          <div className="p-1.5 rounded-lg">
            {statusInfo.icon}
          </div>
        </div>
        <div className="mt-2">
          <span className={`text-xl font-bold font-mono ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
            {statusInfo.sub}
          </p>
        </div>
      </div>
    </div>
  );
};
