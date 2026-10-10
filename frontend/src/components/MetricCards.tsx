import React from 'react';
import { Bus, MapPin, Users, TrendingUp, AlertTriangle, Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
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
        color: 'text-pink-700',
        bg: 'bg-pink-50 border-pink-200',
        sub: 'OR-Tools CBC Processing',
        icon: <RefreshCw className="w-4 h-4 text-pink-600 animate-spin" />,
      };
    }

    const status = optimization.solver_status ? optimization.solver_status.toUpperCase() : 'READY';

    switch (status) {
      case 'OPTIMAL':
        return {
          label: 'OPTIMAL',
          color: 'text-emerald-700',
          bg: 'bg-emerald-50 border-emerald-200',
          sub: `${optimization.transfers.length} Transfers (${optimization.solve_duration_ms}ms)`,
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        };
      case 'FEASIBLE':
        return {
          label: 'FEASIBLE',
          color: 'text-emerald-700',
          bg: 'bg-emerald-50 border-emerald-200',
          sub: `${optimization.transfers.length} Transfers (${optimization.solve_duration_ms}ms)`,
          icon: <Cpu className="w-4 h-4 text-emerald-600" />,
        };
      case 'INFEASIBLE':
        return {
          label: 'INFEASIBLE',
          color: 'text-rose-700',
          bg: 'bg-rose-50 border-rose-200',
          sub: 'Fleet constraints binding',
          icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
        };
      case 'UNAVAILABLE':
        return {
          label: 'UNAVAILABLE',
          color: 'text-amber-800',
          bg: 'bg-amber-50 border-amber-200',
          sub: 'Fallback simulation active',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        };
      default:
        return {
          label: 'READY',
          color: 'text-slate-800',
          bg: 'bg-slate-50 border-slate-200',
          sub: 'Click Run Optimizer',
          icon: <Cpu className="w-4 h-4 text-slate-500" />,
        };
    }
  };

  const statusInfo = getStatusBadge();
  const activeBuses = fleet.total_buses - fleet.maintenance_buses;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Fleet & Active Fleet */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Fleet Status</span>
          <div className="p-1.5 bg-pink-50 rounded-lg text-pink-600">
            <Bus className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-slate-900 font-mono">{fleet.total_buses} Total</span>
          <p className="text-[10px] text-emerald-700 mt-0.5 font-mono font-bold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>{activeBuses} Active in Service</span>
          </p>
        </div>
      </div>

      {/* 2. Bus Stops */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Bus Stops</span>
          <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-slate-900 font-mono">4 Stops</span>
          <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Festival Grid Hubs</p>
        </div>
      </div>

      {/* 3. Crowded / High-Risk Locations */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Crowd / High-Risk</span>
          <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className={`text-xl font-bold font-mono ${criticalStopsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {criticalStopsCount} / 4 Stops
          </span>
          <p className="text-[10px] text-rose-700 mt-0.5 font-mono font-medium">
            {criticalStopsCount > 0 ? 'Surge Risk Detected' : 'All Hubs Clear'}
          </p>
        </div>
      </div>

      {/* 4. Initial Passenger Queue */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Initial Queue</span>
          <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-slate-900 font-mono">{totalQueue} pax</span>
          <p className="text-[10px] text-purple-700 mt-0.5 font-mono">Peak: Main Stand (120)</p>
        </div>
      </div>

      {/* 5. Predicted Passenger Demand */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">2h Forecast Volume</span>
          <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-bold text-slate-900 font-mono">{total2hArrivals} pax</span>
          <p className="text-[10px] text-amber-800 mt-0.5 font-mono truncate" title={nextSurgeText}>
            MAE: {forecast.evaluation_mae} pax • {nextSurgeText}
          </p>
        </div>
      </div>

      {/* 6. Optimization Status & Result State */}
      <div className={`border rounded-xl p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between ${statusInfo.bg}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">OR-Tools Solver</span>
          <div className="p-1.5 rounded-lg">
            {statusInfo.icon}
          </div>
        </div>
        <div className="mt-2">
          <span className={`text-xl font-bold font-mono ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <p className="text-[10px] text-slate-600 mt-0.5 font-mono truncate">
            {statusInfo.sub}
          </p>
        </div>
      </div>
    </div>
  );
};
