import React from 'react';
import {
  Layers,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Bus,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { BusStop, FleetSummary, ForecastResponse, OptimizationResponse } from '../types';

interface AllocationTableProps {
  stops: BusStop[];
  fleet: FleetSummary;
  forecast: ForecastResponse;
  optimization: OptimizationResponse;
}

export const AllocationTable: React.FC<AllocationTableProps> = ({
  stops,
  fleet,
  forecast,
  optimization,
}) => {
  // Compute rows dynamically from active data models
  const rows = stops.map((stop) => {
    const stopFc = forecast.stops_forecast.find((sf) => sf.stop_id === stop.id);
    const initialQueue = stopFc ? stopFc.initial_queue : stop.initial_queue || 0;
    const total2hArrivals = stopFc ? stopFc.total_2h_arrivals : 0;

    // Current buses assigned
    const currentBusItem = fleet.distribution_by_stop.find((d) => d.stop_id === stop.id);
    const currentBuses = currentBusItem ? currentBusItem.bus_count : 0;

    // Transfers involving this stop
    const inboundTransfers = optimization.transfers.filter((t) => t.destination_stop_id === stop.id);
    const outboundTransfers = optimization.transfers.filter((t) => t.origin_stop_id === stop.id);

    const inboundCount = inboundTransfers.reduce((sum, t) => sum + t.bus_count, 0);
    const outboundCount = outboundTransfers.reduce((sum, t) => sum + t.bus_count, 0);
    const netChange = inboundCount - outboundCount;
    const recommendedBuses = currentBuses + netChange;

    // Risk calculation
    let riskLevel = 'LOW';
    if (stopFc) {
      if (stopFc.intervals.some((i) => i.risk_level === 'CRITICAL')) riskLevel = 'CRITICAL';
      else if (stopFc.intervals.some((i) => i.risk_level === 'HIGH')) riskLevel = 'HIGH';
      else if (stopFc.intervals.some((i) => i.risk_level === 'MODERATE')) riskLevel = 'MODERATE';
    }

    // Recommended Action description
    let actionDescription = 'Maintain current allocation (Balanced)';
    if (inboundCount > 0) {
      const fromStops = inboundTransfers.map((t) => `${t.origin_stop_name} (+${t.bus_count})`).join(', ');
      actionDescription = `Receive ${inboundCount} bus${inboundCount > 1 ? 'es' : ''} from ${fromStops}`;
    } else if (outboundCount > 0) {
      const toStops = outboundTransfers.map((t) => `${t.destination_stop_name} (-${t.bus_count})`).join(', ');
      actionDescription = `Dispatch ${outboundCount} bus${outboundCount > 1 ? 'es' : ''} to ${toStops}`;
    }

    return {
      stop,
      initialQueue,
      total2hArrivals,
      currentBuses,
      recommendedBuses,
      netChange,
      riskLevel,
      actionDescription,
      inboundTransfers,
      outboundTransfers,
    };
  });

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
            <span>CRITICAL PEAK</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span>HIGH SURGE</span>
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-yellow-50 text-yellow-800 border border-yellow-200">
            <Clock className="w-3.5 h-3.5 text-yellow-600" aria-hidden="true" />
            <span>MODERATE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>LOW RISK</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Bus Allocation & Crowd-Risk Ledger
            </h2>
            <span className="text-[10px] bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded font-mono font-bold">
              4-Stop Grid
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status comparison between baseline fleet allocations and OR-Tools MILP redistribution recommendations.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <span>Fleet Conserved:</span>
          <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            {fleet.total_buses} / {fleet.total_buses} Buses
          </span>
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
              <th className="py-3 px-3">Festival Stop</th>
              <th className="py-3 px-3 text-right">Initial Queue</th>
              <th className="py-3 px-3 text-right">Predicted 2h Demand</th>
              <th className="py-3 px-3 text-center">Current Buses</th>
              <th className="py-3 px-3 text-center">Recommended Buses</th>
              <th className="py-3 px-3">Crowd-Risk Category</th>
              <th className="py-3 px-3">Recommended Optimizer Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {rows.map((row) => (
              <tr
                key={row.stop.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                {/* Stop Name & ID */}
                <td className="py-3.5 px-3">
                  <div className="font-bold text-slate-900 text-sm font-sans">{row.stop.name}</div>
                  <div className="text-[10px] text-slate-500">{row.stop.id} • Cap: {row.stop.capacity} pax</div>
                </td>

                {/* Initial Queue */}
                <td className="py-3.5 px-3 text-right">
                  <span className="font-bold text-slate-800">{row.initialQueue}</span>
                  <span className="text-[10px] text-slate-500 ml-1">pax</span>
                </td>

                {/* Predicted Demand */}
                <td className="py-3.5 px-3 text-right">
                  <span className="font-bold text-pink-700">{row.total2hArrivals}</span>
                  <span className="text-[10px] text-slate-500 ml-1">pax</span>
                </td>

                {/* Current Buses */}
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                    {row.currentBuses}
                  </span>
                </td>

                {/* Recommended Buses */}
                <td className="py-3.5 px-3 text-center">
                  <div className="inline-flex items-center space-x-1.5">
                    <span
                      className={`px-2.5 py-1 rounded font-bold border ${row.netChange > 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : row.netChange < 0
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                    >
                      {row.recommendedBuses}
                    </span>
                    {row.netChange !== 0 && (
                      <span
                        className={`text-[10px] font-bold ${row.netChange > 0 ? 'text-emerald-700' : 'text-amber-800'
                          }`}
                      >
                        ({row.netChange > 0 ? `+${row.netChange}` : row.netChange})
                      </span>
                    )}
                  </div>
                </td>

                {/* Crowd Risk Level */}
                <td className="py-3.5 px-3">{getRiskBadge(row.riskLevel)}</td>

                {/* Recommended Action */}
                <td className="py-3.5 px-3 font-sans">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-700">
                    {row.netChange !== 0 ? (
                      <Bus className={`w-3.5 h-3.5 shrink-0 ${row.netChange > 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    )}
                    <span>{row.actionDescription}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (Shown on screens < md) */}
      <div className="md:hidden space-y-3 mt-4">
        {rows.map((row) => (
          <div
            key={row.stop.id}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-xs shadow-sm"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-sans">{row.stop.name}</h3>
                <span className="text-[10px] text-slate-500">{row.stop.id}</span>
              </div>
              {getRiskBadge(row.riskLevel)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">INITIAL QUEUE</span>
                <span className="font-bold text-slate-900">{row.initialQueue} pax</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">PREDICTED 2H DEMAND</span>
                <span className="font-bold text-pink-700">{row.total2hArrivals} pax</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CURRENT BUSES</span>
                <span className="font-bold text-slate-800">{row.currentBuses} Buses</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">RECOMMENDED BUSES</span>
                <span className="font-bold text-emerald-800">
                  {row.recommendedBuses} Buses ({row.netChange >= 0 ? `+${row.netChange}` : row.netChange})
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-slate-700 font-sans text-xs flex items-center space-x-2">
              <Bus className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              <span>{row.actionDescription}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
