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
    if (!fc) return { label: 'LOW CROWD', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    const isCritical = fc.intervals.some((i) => i.risk_level === 'CRITICAL');
    const isHigh = fc.intervals.some((i) => i.risk_level === 'HIGH');

    if (isCritical) return { label: 'CRITICAL SURGE', color: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' };
    if (isHigh) return { label: 'HIGH CROWD', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'NORMAL FLOW', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-3xl p-5 shadow-lg my-4 text-slate-800 font-sans">
      {/* Mobile App Bar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-pink-600 rounded-xl text-white shadow-sm">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Festival Bus Live Info</h1>
            <span className="text-[10px] text-slate-500 font-mono">Public Passenger Portal</span>
          </div>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-full font-mono">
          Live Synced
        </span>
      </div>

      {/* Published Service Advisory Banner */}
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl my-4 text-xs text-amber-900">
        <div className="flex items-center space-x-1.5 font-bold text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>FESTIVAL SERVICE ADVISORY</span>
        </div>
        <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
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
                ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
            >
              <div className="text-[11px] font-bold">{s.name}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Stop Card */}
      {selectedStop && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-pink-600 font-mono font-bold uppercase">{selectedStop.id}</span>
              <h2 className="text-lg font-bold text-slate-900">{selectedStop.name}</h2>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold border ${getRiskBadge(selectedStop.id).color}`}>
              {getRiskBadge(selectedStop.id).label}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{selectedStop.description}</p>

          {/* Service Frequency & Arrival Guidance */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs border-t border-b border-slate-200 py-3">
            <div>
              <span className="text-slate-500 text-[10px] block font-medium">BUS FREQUENCY</span>
              <span className="text-sm font-bold text-slate-900">Every 15 mins</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-medium">ESTIMATED WAIT</span>
              <span className="text-sm font-bold text-emerald-700">
                {selectedStop.id === 'STOP-001' ? '8 - 12 mins' : '3 - 5 mins'}
              </span>
            </div>
          </div>

          {/* Alternative Stop Recommendation */}
          {selectedStop.id === 'STOP-001' && (
            <div className="bg-white border border-pink-200 p-3 rounded-xl text-xs space-y-1">
              <div className="flex items-center space-x-1 font-bold text-pink-700">
                <Compass className="w-4 h-4 text-pink-600" />
                <span>RECOMMENDED ALTERNATIVE STOP</span>
              </div>
              <p className="text-[11px] text-slate-600">
                <strong>Temple Road (STOP-002)</strong> is a 6-minute walk north with 70% shorter queue times.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>Updated: {new Date().toLocaleTimeString()}</span>
            <span>Public Information Portal</span>
          </div>
        </div>
      )}
    </div>
  );
};
