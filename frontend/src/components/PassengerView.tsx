import React, { useState } from 'react';
import { Bus, AlertTriangle, Compass } from 'lucide-react';
import type { BusStop, ForecastResponse } from '../types';

interface PassengerViewProps {
  stops: BusStop[];
  forecast: ForecastResponse;
}

export const PassengerView: React.FC<PassengerViewProps> = ({ stops, forecast }) => {
  const [selectedStopId, setSelectedStopId] = useState<string>(stops[0]?.id || 'STOP-001');

  const selectedStop = stops.find((s) => s.id === selectedStopId) || stops[0];

  const getRiskBadge = (stopId: string) => {
    const fc = forecast.stops_forecast.find((sf) => sf.stop_id === stopId);
    if (!fc) return { label: 'LOW CROWD', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    const isCritical = fc.intervals.some((i) => i.risk_level === 'CRITICAL');
    const isHigh = fc.intervals.some((i) => i.risk_level === 'HIGH');

    if (isCritical) return { label: 'CRITICAL SURGE', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' };
    if (isHigh) return { label: 'HIGH CROWD', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    return { label: 'NORMAL FLOW', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl my-4 text-slate-100 font-sans">

      {/* Mobile App Bar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Festival Bus Live Info</h1>
            <span className="text-[10px] text-slate-400 font-mono">Public Passenger Portal</span>
          </div>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-full font-mono">
          Live Synced
        </span>
      </div>

      {/* Published Service Advisory Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl my-4 text-xs text-amber-200">
        <div className="flex items-center space-x-1.5 font-bold text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>FESTIVAL SERVICE ADVISORY</span>
        </div>
        <p className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
          Main Stand experiences heavy crowd exits after headliner stage events. Passengers heading to North Zone are advised to use <strong>Temple Road</strong> stop for faster boarding.
        </p>
      </div>

      {/* Stop Selector Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none font-mono text-xs">
        {stops.map((s) => {
          const isSelected = selectedStopId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedStopId(s.id)}
              className={`px-3 py-2 rounded-xl transition-all font-semibold whitespace-nowrap text-left border ${isSelected
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg'
                : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
            >
              <div className="text-[11px] font-bold">{s.name}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Stop Card */}
      {selectedStop && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 mt-3 space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">{selectedStop.id}</span>
              <h2 className="text-lg font-bold text-white">{selectedStop.name}</h2>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold border ${getRiskBadge(selectedStop.id).color}`}>
              {getRiskBadge(selectedStop.id).label}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{selectedStop.description}</p>

          {/* Service Frequency & Arrival Guidance */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs border-t border-b border-slate-800/80 py-3">
            <div>
              <span className="text-slate-400 text-[10px] block">BUS FREQUENCY</span>
              <span className="text-sm font-bold text-white">Every 15 mins</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">ESTIMATED WAIT</span>
              <span className="text-sm font-bold text-emerald-400">
                {selectedStop.id === 'STOP-001' ? '8 - 12 mins' : '3 - 5 mins'}
              </span>
            </div>
          </div>

          {/* Alternative Stop Recommendation */}
          {selectedStop.id === 'STOP-001' && (
            <div className="bg-slate-900 border border-indigo-500/30 p-3 rounded-xl text-xs space-y-1">
              <div className="flex items-center space-x-1 font-bold text-indigo-300">
                <Compass className="w-4 h-4" />
                <span>RECOMMENDED ALTERNATIVE STOP</span>
              </div>
              <p className="text-[11px] text-slate-300">
                <strong>Temple Road (STOP-002)</strong> is a 6-minute walk north with 70% shorter queue times.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
            <span>Updated: {new Date().toLocaleTimeString()}</span>
            <span>Public Information Portal</span>
          </div>

        </div>
      )}

    </div>
  );
};
