import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import type { OptimizationResponse } from '../types';

interface FleetTimelineProps {
  optimization: OptimizationResponse;
}

export const FleetTimeline: React.FC<FleetTimelineProps> = ({ optimization }) => {
  const [selectedStopId, setSelectedStopId] = useState<string>('STOP-001');

  const selectedTimeline = optimization.stop_timelines.find((st) => st.stop_id === selectedStopId) || optimization.stop_timelines[0];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Time-Expanded Bus Allocation Timeline</h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-mono font-semibold">
              2-Hour Horizon (T0..T7)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step audit of bus positions, arrivals, departures, passengers served, and remaining queues.
          </p>
        </div>

        {/* Stop Selector Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
          {optimization.stop_timelines.map((st) => (
            <button
              key={st.stop_id}
              onClick={() => setSelectedStopId(st.stop_id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all font-semibold whitespace-nowrap ${selectedStopId === st.stop_id
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
            >
              {st.stop_name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Stop Key Metrics */}
      {selectedTimeline && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 font-mono text-xs">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-500 text-[10px] block font-medium">INITIAL QUEUE</span>
            <span className="text-sm font-bold text-slate-900">{selectedTimeline.initial_queue} pax</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-500 text-[10px] block font-medium">TOTAL 2H ARRIVALS</span>
            <span className="text-sm font-bold text-pink-700">{selectedTimeline.total_arrivals} pax</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-500 text-[10px] block font-medium">PASSENGERS SERVED</span>
            <span className="text-sm font-bold text-emerald-700">{selectedTimeline.total_served} pax</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-500 text-[10px] block font-medium">PEAK QUEUE LENGTH</span>
            <span className={`text-sm font-bold ${selectedTimeline.peak_queue > 100 ? 'text-amber-700' : 'text-slate-900'}`}>
              {selectedTimeline.peak_queue} pax
            </span>
          </div>
        </div>
      )}

      {/* Timeline Matrix Table */}
      <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700 font-mono">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-3">Interval</th>
              <th className="py-3 px-3">Buses Stationed</th>
              <th className="py-3 px-3">Departures</th>
              <th className="py-3 px-3">Arrivals</th>
              <th className="py-3 px-3">New Arrivals</th>
              <th className="py-3 px-3">Served (pax)</th>
              <th className="py-3 px-3">Ending Queue</th>
              <th className="py-3 px-3">Unmet Demand</th>
              <th className="py-3 px-3">Crowd Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {selectedTimeline?.intervals.map((iv) => (
              <tr key={iv.interval_index} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 font-bold text-pink-700">{iv.time_label}</td>
                <td className="py-3 px-3 font-bold text-slate-900">{iv.buses_stationed}</td>
                <td className="py-3 px-3 text-amber-700 font-semibold">{iv.buses_departing > 0 ? `-${iv.buses_departing}` : '0'}</td>
                <td className="py-3 px-3 text-emerald-700 font-semibold">{iv.buses_arriving > 0 ? `+${iv.buses_arriving}` : '0'}</td>
                <td className="py-3 px-3 text-sky-700">+{iv.arrivals}</td>
                <td className="py-3 px-3 text-emerald-700 font-bold">+{iv.passengers_served}</td>
                <td className="py-3 px-3 font-bold text-slate-900">{iv.ending_queue}</td>
                <td className={`py-3 px-3 font-bold ${iv.unmet_demand > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {iv.unmet_demand}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${iv.crowd_risk === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : iv.crowd_risk === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : iv.crowd_risk === 'MODERATE'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                  >
                    {iv.crowd_risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
