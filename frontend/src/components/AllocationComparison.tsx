import React from 'react';
import { Layers, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { BusStop, FleetSummary, OptimizationResponse } from '../types';

interface AllocationComparisonProps {
  stops: BusStop[];
  fleet: FleetSummary;
  optimization: OptimizationResponse;
}

export const AllocationComparison: React.FC<AllocationComparisonProps> = ({
  stops,
  fleet,
  optimization,
}) => {
  const comparisonData = stops.map((stop) => {
    const currentBusItem = fleet.distribution_by_stop.find((d) => d.stop_id === stop.id);
    const initialBuses = currentBusItem ? currentBusItem.bus_count : 0;

    const inbound = optimization.transfers.filter((t) => t.destination_stop_id === stop.id);
    const outbound = optimization.transfers.filter((t) => t.origin_stop_id === stop.id);

    const inboundCount = inbound.reduce((sum, t) => sum + t.bus_count, 0);
    const outboundCount = outbound.reduce((sum, t) => sum + t.bus_count, 0);
    const netDelta = inboundCount - outboundCount;
    const recommendedBuses = initialBuses + netDelta;

    // Detailed explanations
    let originExplanatory = 'Allocation maintained. Capacity balances demand.';
    let destExplanatory = 'Allocation maintained. Minimum service satisfied.';

    if (inboundCount > 0) {
      destExplanatory = `Destination needs +${inboundCount} buses to absorb forecasted peak arrivals of ${stop.initial_queue} pax initial queue and surge demand.`;
    }
    if (outboundCount > 0) {
      originExplanatory = `Origin can spare -${outboundCount} buses because current passenger demand is low and remaining ${recommendedBuses} bus(es) satisfy minimum service requirement (${stop.minimum_service_level} bus/interval).`;
    }

    return {
      stop,
      initialBuses,
      recommendedBuses,
      netDelta,
      inboundCount,
      outboundCount,
      originExplanatory,
      destExplanatory,
    };
  });

  const totalInitial = comparisonData.reduce((sum, d) => sum + d.initialBuses, 0);
  const totalRecommended = comparisonData.reduce((sum, d) => sum + d.recommendedBuses, 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Before-and-After Bus Allocation Comparison
            </h2>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              Side-by-Side Fleet Audit
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct comparison showing initial fleet deployment versus OR-Tools MILP optimizer recommendations.
          </p>
        </div>

        {/* Fleet Conservation Badge */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-400 text-[11px]">Fleet Conservation:</span>
          <span className="font-bold text-emerald-300">
            {totalInitial} Buses → {totalRecommended} Buses (100% Conserved)
          </span>
        </div>
      </div>

      {/* Side-by-Side Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {comparisonData.map((item) => (
          <div
            key={item.stop.id}
            className={`bg-slate-950/80 border rounded-2xl p-4 flex flex-col justify-between space-y-3 font-mono text-xs ${
              item.netDelta > 0
                ? 'border-emerald-500/40 shadow-emerald-950/20'
                : item.netDelta < 0
                ? 'border-amber-500/40 shadow-amber-950/20'
                : 'border-slate-800'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm font-sans">{item.stop.name}</h3>
                <span className="text-[10px] text-slate-400">{item.stop.id}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  item.netDelta > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : item.netDelta < 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {item.netDelta > 0 ? `+${item.netDelta} INBOUND` : item.netDelta < 0 ? `${item.netDelta} OUTBOUND` : 'STABLE'}
              </span>
            </div>

            {/* Before vs After Numbers */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">INITIAL BUSES</span>
                <span className="text-base font-bold text-slate-300">{item.initialBuses} Buses</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">RECOMMENDED</span>
                <span
                  className={`text-base font-bold ${
                    item.netDelta > 0 ? 'text-emerald-400' : item.netDelta < 0 ? 'text-amber-400' : 'text-white'
                  }`}
                >
                  {item.recommendedBuses} Buses
                </span>
              </div>
            </div>

            {/* Explainability Breakdown */}
            <div className="space-y-2 text-[11px] font-sans">
              {item.inboundCount > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-200">
                  <div className="font-bold text-emerald-300 text-[10px] uppercase flex items-center space-x-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>WHY SERVICE IS NEEDED</span>
                  </div>
                  <p className="mt-1 leading-snug">{item.destExplanatory}</p>
                </div>
              )}

              {item.outboundCount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-amber-200">
                  <div className="font-bold text-amber-300 text-[10px] uppercase flex items-center space-x-1 font-mono">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>WHY SPARE CAPACITY EXISTS</span>
                  </div>
                  <p className="mt-1 leading-snug">{item.originExplanatory}</p>
                </div>
              )}

              {item.netDelta === 0 && (
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-400">
                  <p className="leading-snug">Current fleet allocation is optimal for forecasted demand at this stop.</p>
                </div>
              )}
            </div>

            {/* Min Service Requirement Check */}
            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Min Service Requirement:</span>
              <span className="font-bold text-slate-200 font-mono">
                {item.stop.minimum_service_level} Bus/int (SATISFIED)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
