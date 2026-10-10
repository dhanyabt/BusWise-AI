import React, { useState } from 'react';
import { Navigation, Bus, ArrowRight } from 'lucide-react';
import type { BusStop, ForecastResponse } from '../types';

interface TripPlannerProps {
  stops: BusStop[];
  forecast: ForecastResponse;
  onSelectRoute?: (originId: string, destId: string) => void;
}

export const TripPlanner: React.FC<TripPlannerProps> = ({ stops, forecast, onSelectRoute }) => {
  const [originId, setOriginId] = useState<string>('STOP-001');
  const [destId, setDestId] = useState<string>('STOP-003');
  const [selectedJourney, setSelectedJourney] = useState<any | null>(null);

  const originStop = stops.find((s) => s.id === originId) || stops[0];
  const destStop = stops.find((s) => s.id === destId) || stops[2];

  // Compute crowd risk at origin
  const originFc = forecast.stops_forecast.find((sf) => sf.stop_id === originId);
  const originRisk = originFc?.intervals[0]?.risk_level || 'LOW';

  // Compute crowd risk at destination
  const destFc = forecast.stops_forecast.find((sf) => sf.stop_id === destId);
  const destRisk = destFc?.intervals[0]?.risk_level || 'LOW';

  // Generate 2 travel route options
  const routes = [
    {
      id: 'route-express',
      name: 'Express Festival Shuttle (Route A1)',
      busNumber: 'BW-101',
      travelTimeMinutes: 30,
      headwayMinutes: 10,
      nextBusArrival: '5 mins',
      crowdStatus: originRisk,
      fare: '₹25',
      transfers: 0,
      recommended: originRisk !== 'CRITICAL',
    },
    {
      id: 'route-connector',
      name: 'Intercity Connector (Route C4)',
      busNumber: 'BW-302',
      travelTimeMinutes: 35,
      headwayMinutes: 15,
      nextBusArrival: '12 mins',
      crowdStatus: destRisk,
      fare: '₹20',
      transfers: 1,
      recommended: false,
    },
  ];

  const handleSelect = (r: any) => {
    setSelectedJourney(r);
    if (onSelectRoute) {
      onSelectRoute(originId, destId);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Passenger Trip Planner & Bus Journey Tracker
            </h2>
            <span className="text-[10px] bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded font-mono font-bold">
              Public Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Plan festival journeys, compare route crowd conditions, inspect live bus schedules, and track journey progress.
          </p>
        </div>
      </div>

      {/* Origin & Destination Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono">
        <div>
          <label className="text-slate-600 block mb-1 font-bold">Select Origin Bus Stop:</label>
          <select
            value={originId}
            onChange={(e) => setOriginId(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-600 block mb-1 font-bold">Select Destination Bus Stop:</label>
          <select
            value={destId}
            onChange={(e) => setDestId(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Available Routes List */}
      <div className="mt-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
          Available Travel Routes for Selected Journey
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((r) => (
            <div
              key={r.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 font-mono text-xs ${selectedJourney?.id === r.id
                ? 'bg-pink-50/40 border-pink-500 ring-1 ring-pink-500/40 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <Bus className="w-4 h-4 text-pink-600" />
                  <span className="font-bold text-slate-900 font-sans">{r.name}</span>
                </div>
                {r.recommended && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                    RECOMMENDED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700">
                <div>
                  <span className="text-slate-500 block text-[10px]">TRAVEL TIME</span>
                  <strong className="text-slate-900">{r.travelTimeMinutes} mins</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">NEXT BUS</span>
                  <strong className="text-pink-700">{r.nextBusArrival}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CROWD LEVEL</span>
                  <strong
                    className={
                      r.crowdStatus === 'CRITICAL'
                        ? 'text-rose-600'
                        : r.crowdStatus === 'HIGH'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                    }
                  >
                    {r.crowdStatus}
                  </strong>
                </div>
              </div>

              <button
                onClick={() => handleSelect(r)}
                className={`w-full py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 ${selectedJourney?.id === r.id
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                  }`}
              >
                <span>{selectedJourney?.id === r.id ? 'Journey Selected' : 'Select Journey'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Journey Progress Tracker */}
      {selectedJourney && (
        <div className="mt-5 bg-pink-50/50 border border-pink-200 p-4 rounded-xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-pink-200">
            <span className="font-bold text-pink-900 font-sans text-sm">
              Live Journey Tracker — Bus {selectedJourney.busNumber}
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              EN ROUTE
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-900">
            <div>
              <span className="text-[10px] text-slate-500 block">DEPARTURE</span>
              <strong>{originStop?.name}</strong>
            </div>
            <ArrowRight className="w-4 h-4 text-pink-600" />
            <div>
              <span className="text-[10px] text-slate-500 block">DESTINATION</span>
              <strong>{destStop?.name}</strong>
            </div>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
            <div className="bg-pink-600 h-2 rounded-full w-2/5 animate-pulse"></div>
          </div>

          <p className="text-[11px] text-slate-700 font-sans">
            Bus {selectedJourney.busNumber} is currently 5 minutes away from {originStop?.name}. Estimated arrival at {destStop?.name} in {selectedJourney.travelTimeMinutes} minutes.
          </p>
        </div>
      )}
    </div>
  );
};
