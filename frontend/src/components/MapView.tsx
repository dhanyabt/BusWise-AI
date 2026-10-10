import React, { useState } from 'react';
import { MapPin, Bus, Info, Navigation, ArrowRight } from 'lucide-react';
import type { BusStop, FleetSummary, TransferCard, ForecastResponse } from '../types';

interface MapViewProps {
  stops: BusStop[];
  fleet: FleetSummary;
  transfers: TransferCard[];
  forecast: ForecastResponse;
}

export const MapView: React.FC<MapViewProps> = ({ stops, fleet, transfers, forecast }) => {
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(stops[0] || null);

  // Map stop ID to fleet count
  const getBusCount = (stopId: string) => {
    const item = fleet.distribution_by_stop.find((d) => d.stop_id === stopId);
    return item ? item.bus_count : 0;
  };

  // Map stop ID to risk level
  const getRiskLevel = (stopId: string) => {
    const stopFc = forecast.stops_forecast.find((sf) => sf.stop_id === stopId);
    if (!stopFc) return 'LOW';
    const isCritical = stopFc.intervals.some((i) => i.risk_level === 'CRITICAL');
    const isHigh = stopFc.intervals.some((i) => i.risk_level === 'HIGH');
    const isMod = stopFc.intervals.some((i) => i.risk_level === 'MODERATE');
    if (isCritical) return 'CRITICAL';
    if (isHigh) return 'HIGH';
    if (isMod) return 'MODERATE';
    return 'LOW';
  };

  // Get total 2h demand for stop
  const getPredictedDemand = (stopId: string) => {
    const stopFc = forecast.stops_forecast.find((sf) => sf.stop_id === stopId);
    return stopFc ? stopFc.total_2h_arrivals : 0;
  };

  // Color & Badge mappings
  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return {
          container: 'bg-rose-950/70 border-rose-500/60 text-rose-300 shadow-rose-900/30',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          pin: 'text-rose-400',
          label: 'CRITICAL PEAK',
        };
      case 'HIGH':
        return {
          container: 'bg-amber-950/70 border-amber-500/60 text-amber-300 shadow-amber-900/30',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          pin: 'text-amber-400',
          label: 'HIGH SURGE',
        };
      case 'MODERATE':
        return {
          container: 'bg-yellow-950/60 border-yellow-500/50 text-yellow-300 shadow-yellow-900/20',
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          pin: 'text-yellow-400',
          label: 'MODERATE',
        };
      default:
        return {
          container: 'bg-slate-900/90 border-emerald-500/40 text-emerald-300 shadow-emerald-900/20',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          pin: 'text-emerald-400',
          label: 'LOW RISK',
        };
    }
  };

  // Stop position mapping on visual schematic grid (percentage based)
  const getSchematicPosition = (stopId: string) => {
    switch (stopId) {
      case 'STOP-001': // Main Stand (Center-Left)
        return { top: '38%', left: '32%', svgX: 200, svgY: 160 };
      case 'STOP-002': // Temple Road (North-East)
        return { top: '22%', left: '72%', svgX: 450, svgY: 90 };
      case 'STOP-003': // Railway Station (South)
        return { top: '74%', left: '38%', svgX: 240, svgY: 280 };
      case 'STOP-004': // Market Road (North-West)
        return { top: '22%', left: '20%', svgX: 130, svgY: 90 };
      default:
        return { top: '50%', left: '50%', svgX: 300, svgY: 180 };
    }
  };

  // Determine transfer role (Destination / Origin / None)
  const getTransferRole = (stopId: string) => {
    const inbound = transfers.filter((t) => t.destination_stop_id === stopId);
    const outbound = transfers.filter((t) => t.origin_stop_id === stopId);

    const inCount = inbound.reduce((sum, t) => sum + t.bus_count, 0);
    const outCount = outbound.reduce((sum, t) => sum + t.bus_count, 0);

    if (inCount > 0) {
      return {
        role: 'NEEDS_BUSES',
        text: `Needs +${inCount} Buses (Inbound Surge)`,
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      };
    }
    if (outCount > 0) {
      return {
        role: 'SPARES_BUSES',
        text: `Can Spare -${outCount} Buses (Surplus Fleet)`,
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50',
      };
    }
    return {
      role: 'BALANCED',
      text: 'Balanced Allocation',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
    };
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">4-Stop Festival Transport Map</h2>
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
              Schematic Topology
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Schematic network of 4 festival stops, active bus allocations, crowd risk levels, and recommended transfer vectors.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-400">Low Risk</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-400">High Surge</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block"></span>
            <span className="text-slate-400">Critical Peak</span>
          </div>
          <div className="flex items-center space-x-1.5 border-l border-slate-800 pl-3">
            <span className="w-2.5 h-1 bg-indigo-400 rounded inline-block"></span>
            <span className="text-indigo-300">Transfer Vector</span>
          </div>
        </div>
      </div>

      {/* Schematic Map & Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5">
        {/* Schematic Interactive Map Canvas */}
        <div className="lg:col-span-2 relative min-h-[420px] bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 sm:p-6 overflow-hidden flex flex-col justify-between">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

          {/* Canvas Title Overlay */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-md">
              SCHEMATIC FESTIVAL ZONE TOPOLOGY — NOT TO GEOGRAPHIC SCALE
            </span>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md font-bold">
              DEMO DATA — NOT LIVE
            </span>
          </div>

          {/* Interactive Transfer Vector Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 600 360" preserveAspectRatio="none">
            <defs>
              <linearGradient id="vectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
              </linearGradient>
              <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#34d399" />
              </marker>
            </defs>

            {/* Static route corridors between hubs */}
            <line x1="130" y1="90" x2="200" y2="160" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="200" y1="160" x2="450" y2="90" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="200" y1="160" x2="240" y2="280" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Dynamic Transfer Recommendation Vectors */}
            {transfers.map((t) => {
              const orig = getSchematicPosition(t.origin_stop_id);
              const dest = getSchematicPosition(t.destination_stop_id);
              return (
                <g key={t.id}>
                  <line
                    x1={orig.svgX}
                    y1={orig.svgY}
                    x2={dest.svgX}
                    y2={dest.svgY}
                    stroke="url(#vectorGrad)"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}
          </svg>

          {/* Bus Stop Markers on Canvas */}
          <div className="relative w-full h-[320px] z-10">
            {stops.map((stop) => {
              const pos = getSchematicPosition(stop.id);
              const busCount = getBusCount(stop.id);
              const risk = getRiskLevel(stop.id);
              const riskStyle = getRiskStyles(risk);
              const roleInfo = getTransferRole(stop.id);
              const isSelected = selectedStop?.id === stop.id;

              return (
                <button
                  key={stop.id}
                  onClick={() => setSelectedStop(stop)}
                  style={{ top: pos.top, left: pos.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl border transition-all duration-300 text-left shadow-xl ${riskStyle.container
                    } ${isSelected
                      ? 'ring-2 ring-indigo-400 scale-105 z-20'
                      : 'hover:scale-102 hover:border-indigo-400/60'
                    }`}
                >
                  <div className="flex items-start space-x-2">
                    <MapPin className={`w-5 h-5 shrink-0 ${riskStyle.pin}`} />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-bold text-white leading-tight font-sans">{stop.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border ${riskStyle.badge}`}>
                          {riskStyle.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                        Queue: <strong className="text-white">{stop.initial_queue}</strong> pax • Demand: <strong className="text-indigo-300">{getPredictedDemand(stop.id)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Transfer Role Flag Badge */}
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[10px] font-mono">
                    <div className="flex items-center space-x-1 text-slate-200">
                      <Bus className="w-3 h-3 text-indigo-300" />
                      <span><strong>{busCount}</strong> Buses</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleInfo.badgeClass}`}>
                      {roleInfo.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Transfers Summary Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 gap-2">
            <span className="font-mono">
              Active Transfer Movements:{' '}
              <strong className="text-white">{transfers.length}</strong>
            </span>
            <span className="text-[11px] text-indigo-300 font-mono">
              Click any stop node above for full queue dynamics
            </span>
          </div>
        </div>

        {/* Selected Stop Details Sidebar */}
        <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
          {selectedStop ? (
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-indigo-400 font-mono uppercase font-bold">{selectedStop.id}</span>
                  <h3 className="text-base font-bold text-white">{selectedStop.name}</h3>
                </div>
                {(() => {
                  const risk = getRiskLevel(selectedStop.id);
                  const style = getRiskStyles(risk);
                  return (
                    <span className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold border ${style.badge}`}>
                      {style.label}
                    </span>
                  );
                })()}
              </div>

              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Festival Zone Role:</span>
                  <p className="text-slate-200 mt-0.5 text-xs">{selectedStop.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-lg font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CURRENT QUEUE</span>
                    <span className="text-sm font-bold text-white">{selectedStop.initial_queue} pax</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">STATIONED BUSES</span>
                    <span className="text-sm font-bold text-indigo-400">{getBusCount(selectedStop.id)} Buses</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">STOP CAPACITY</span>
                    <span className="text-sm font-bold text-white">{selectedStop.capacity} pax</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">MIN SERVICE REQ</span>
                    <span className="text-sm font-bold text-amber-400">{selectedStop.minimum_service_level} Bus/int</span>
                  </div>
                </div>

                {/* Transfer Actions Involving this Stop */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider font-mono">
                    Redistribution Vector Breakdown
                  </h4>
                  {transfers.filter((t) => t.origin_stop_id === selectedStop.id || t.destination_stop_id === selectedStop.id).length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      No transfers required for this stop in this scenario. Fleet allocation satisfies passenger demand.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {transfers
                        .filter((t) => t.origin_stop_id === selectedStop.id || t.destination_stop_id === selectedStop.id)
                        .map((t) => {
                          const isDest = t.destination_stop_id === selectedStop.id;
                          return (
                            <div
                              key={t.id}
                              className={`p-3 rounded-lg text-xs border ${isDest
                                  ? 'bg-emerald-950/30 border-emerald-500/40'
                                  : 'bg-indigo-950/30 border-indigo-500/40'
                                }`}
                            >
                              <div className="flex items-center justify-between font-mono font-bold">
                                <span className={isDest ? 'text-emerald-300' : 'text-indigo-300'}>
                                  {isDest ? 'INBOUND SURGE RELIEF' : 'OUTBOUND FLEET TRANSFER'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-white">
                                  {t.bus_count} Buses
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-xs text-slate-200 mt-1 font-mono">
                                <span>{t.origin_stop_name}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span>{t.destination_stop_name}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 mt-1.5 font-sans leading-relaxed">
                                {isDest ? t.destination_benefit_explanation : t.origin_impact_explanation}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              Select a bus stop on the schematic map to view detailed analytics
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Updates in real-time when running the OR-Tools optimizer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
