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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur mb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Time-Expanded Bus Allocation Timeline</h2>
            <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
              2-Hour Horizon (T0..T7)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Step-by-step audit of bus positions, arrivals, departures, passengers served, and remaining queues.
          </p>
        </div>

        {/* Stop Selector Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {optimization.stop_timelines.map((st) => (
            <button
              key={st.stop_id}
              onClick={() => setSelectedStopId(st.stop_id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all font-semibold whitespace-nowrap ${selectedStopId === st.stop_id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-slate-400 text-[10px] block">INITIAL QUEUE</span>
            <span className="text-sm font-bold text-white">{selectedTimeline.initial_queue} pax</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-slate-400 text-[10px] block">TOTAL 2H ARRIVALS</span>
            <span className="text-sm font-bold text-indigo-300">{selectedTimeline.total_arrivals} pax</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-slate-400 text-[10px] block">PASSENGERS SERVED</span>
            <span className="text-sm font-bold text-emerald-400">{selectedTimeline.total_served} pax</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-slate-400 text-[10px] block">PEAK QUEUE LENGTH</span>
            <span className={`text-sm font-bold ${selectedTimeline.peak_queue > 100 ? 'text-amber-400' : 'text-slate-200'}`}>
              {selectedTimeline.peak_queue} pax
            </span>
          </div>
        </div>
      )}

      {/* Timeline Matrix Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs text-slate-300 font-mono">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
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
          <tbody className="divide-y divide-slate-800/60">
            {selectedTimeline?.intervals.map((iv) => (
              <tr key={iv.interval_index} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-3 font-bold text-indigo-300">{iv.time_label}</td>
                <td className="py-3 px-3 font-bold text-white">{iv.buses_stationed}</td>
                <td className="py-3 px-3 text-amber-400">{iv.buses_departing > 0 ? `-${iv.buses_departing}` : '0'}</td>
                <td className="py-3 px-3 text-emerald-400">{iv.buses_arriving > 0 ? `+${iv.buses_arriving}` : '0'}</td>
                <td className="py-3 px-3 text-cyan-300">+{iv.arrivals}</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">+{iv.passengers_served}</td>
                <td className="py-3 px-3 font-bold text-white">{iv.ending_queue}</td>
                <td className={`py-3 px-3 font-bold ${iv.unmet_demand > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {iv.unmet_demand}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${iv.crowd_risk === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300'
                      : iv.crowd_risk === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300'
                        : iv.crowd_risk === 'MODERATE'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-emerald-500/20 text-emerald-300'
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
