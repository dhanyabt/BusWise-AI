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
          container: 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          pin: 'text-rose-600',
          label: 'CRITICAL PEAK',
        };
      case 'HIGH':
        return {
          container: 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          pin: 'text-amber-600',
          label: 'HIGH SURGE',
        };
      case 'MODERATE':
        return {
          container: 'bg-yellow-50 border-yellow-300 text-yellow-900 shadow-sm',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          pin: 'text-yellow-600',
          label: 'MODERATE',
        };
      default:
        return {
          container: 'bg-white border-slate-200 text-slate-800 shadow-sm',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          pin: 'text-emerald-600',
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
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      };
    }
    if (outCount > 0) {
      return {
        role: 'SPARES_BUSES',
        text: `Can Spare -${outCount} Buses (Surplus Fleet)`,
        badgeClass: 'bg-pink-50 text-pink-700 border-pink-300',
      };
    }
    return {
      role: 'BALANCED',
      text: 'Balanced Allocation',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">4-Stop Festival Transport Map</h2>
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">
              Schematic Topology
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Schematic network of 4 festival stops, active bus allocations, crowd risk levels, and recommended transfer vectors.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-600 font-medium">Low Risk</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-600 font-medium">High Surge</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block"></span>
            <span className="text-slate-600 font-medium">Critical Peak</span>
          </div>
          <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
            <span className="w-2.5 h-1 bg-pink-600 rounded inline-block"></span>
            <span className="text-pink-600 font-semibold">Transfer Vector</span>
          </div>
        </div>
      </div>

      {/* Schematic Map & Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5">
        {/* Schematic Interactive Map Canvas */}
        <div className="lg:col-span-2 relative min-h-[420px] bg-slate-50/80 rounded-xl border border-slate-200 p-4 sm:p-6 overflow-hidden flex flex-col justify-between">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

          {/* Canvas Title Overlay */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-slate-600 bg-white/90 border border-slate-200 px-2.5 py-1 rounded-md shadow-xs">
              SCHEMATIC FESTIVAL ZONE TOPOLOGY — NOT TO GEOGRAPHIC SCALE
            </span>
            <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-bold">
              DEMO DATA — NOT LIVE
            </span>
          </div>

          {/* Interactive Transfer Vector Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 600 360" preserveAspectRatio="none">
            <defs>
              <linearGradient id="vectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#db2777" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
              </linearGradient>
              <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="#059669" />
              </marker>
            </defs>

            {/* Static route corridors between hubs */}
            <line x1="130" y1="90" x2="200" y2="160" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="200" y1="160" x2="450" y2="90" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="200" y1="160" x2="240" y2="280" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />

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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl border transition-all duration-300 text-left shadow-sm ${riskStyle.container
                    } ${isSelected
                      ? 'ring-2 ring-pink-500 scale-105 z-20 shadow-md'
                      : 'hover:scale-102 hover:border-pink-300'
                    }`}
                >
                  <div className="flex items-start space-x-2">
                    <MapPin className={`w-5 h-5 shrink-0 ${riskStyle.pin}`} />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight font-sans">{stop.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border ${riskStyle.badge}`}>
                          {riskStyle.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                        Queue: <strong className="text-slate-900">{stop.initial_queue}</strong> pax • Demand: <strong className="text-pink-600">{getPredictedDemand(stop.id)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Transfer Role Flag Badge */}
                  <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between gap-2 text-[10px] font-mono">
                    <div className="flex items-center space-x-1 text-slate-700">
                      <Bus className="w-3 h-3 text-pink-600" />
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
          <div className="relative z-10 flex flex-wrap items-center justify-between text-xs text-slate-600 border-t border-slate-200 pt-3 gap-2">
            <span className="font-mono">
              Active Transfer Movements:{' '}
              <strong className="text-slate-900">{transfers.length}</strong>
            </span>
            <span className="text-[11px] text-pink-600 font-mono font-semibold">
              Click any stop node above for full queue dynamics
            </span>
          </div>
        </div>

        {/* Selected Stop Details Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
          {selectedStop ? (
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] text-pink-600 font-mono uppercase font-bold">{selectedStop.id}</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedStop.name}</h3>
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
                  <span className="text-slate-500 text-[11px] font-medium">Festival Zone Role:</span>
                  <p className="text-slate-700 mt-0.5 text-xs leading-relaxed">{selectedStop.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 p-3 rounded-lg font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">CURRENT QUEUE</span>
                    <span className="text-sm font-bold text-slate-900">{selectedStop.initial_queue} pax</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">STATIONED BUSES</span>
                    <span className="text-sm font-bold text-pink-600">{getBusCount(selectedStop.id)} Buses</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">STOP CAPACITY</span>
                    <span className="text-sm font-bold text-slate-900">{selectedStop.capacity} pax</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">MIN SERVICE REQ</span>
                    <span className="text-sm font-bold text-amber-700">{selectedStop.minimum_service_level} Bus/int</span>
                  </div>
                </div>

                {/* Transfer Actions Involving this Stop */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider font-mono">
                    Redistribution Vector Breakdown
                  </h4>
                  {transfers.filter((t) => t.origin_stop_id === selectedStop.id || t.destination_stop_id === selectedStop.id).length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
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
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : 'bg-pink-50/70 border-pink-200'
                                }`}
                            >
                              <div className="flex items-center justify-between font-mono font-bold">
                                <span className={isDest ? 'text-emerald-800' : 'text-pink-800'}>
                                  {isDest ? 'INBOUND SURGE RELIEF' : 'OUTBOUND FLEET TRANSFER'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-800">
                                  {t.bus_count} Buses
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-xs text-slate-700 mt-1 font-mono font-medium">
                                <span>{t.origin_stop_name}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span>{t.destination_stop_name}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1.5 font-sans leading-relaxed">
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

          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-pink-600 shrink-0" />
            <span>Updates in real-time when running the OR-Tools optimizer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
