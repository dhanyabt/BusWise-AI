import React from 'react';
import { Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LabelList,
} from 'recharts';

import syntheticScenario from '../data/synthetic_demo_scenario.json';

interface TimeToSurgeViewProps {
  scenarioName: string;
  demandMultiplier: number;
}

interface StopCrowdSummary {
  stop_id: string;
  stop_name: string;
  current_waiting: number;
  exp_15m: number;
  exp_30m: number;
  exp_60m: number;
  available_buses: number;
  est_wait_time_mins: number;
  crowd_level: 'Low' | 'Medium' | 'High' | 'Critical';
  recommended_action: string;
}

export const TimeToSurgeView: React.FC<TimeToSurgeViewProps> = () => {
  const stopsData: StopCrowdSummary[] = syntheticScenario.stops.map((s) => ({
    stop_id: s.id,
    stop_name: s.name,
    current_waiting: s.passengersPer15Min,
    exp_15m: s.passengersPer15Min,
    exp_30m: s.passengersPer15Min,
    exp_60m: Math.round(s.passengersPer15Min * 0.95),
    available_buses: s.assignedBuses,
    est_wait_time_mins: s.passengersPer15Min > 300 ? 35 : s.passengersPer15Min > 200 ? 20 : s.passengersPer15Min > 80 ? 8 : 2,
    crowd_level: s.crowdLevel as 'Low' | 'Medium' | 'High' | 'Critical',
    recommended_action:
      s.id === 'STOP-001'
        ? 'Move 2 available buses from T. Nagar Market Road to CMBT Koyambedu immediately.'
        : s.id === 'STOP-003'
        ? 'Move 1 available bus from T. Nagar Market Road to Chennai Central Railway Station.'
        : s.id === 'STOP-002'
        ? 'Maintain existing 2 assigned buses to keep waiting time low.'
        : 'Move excess buses where needed to relieve crowding at CMBT & Chennai Central.',
  }));

  // Colors for Crowd Levels
  const getBadgeStyle = (level: 'Low' | 'Medium' | 'High' | 'Critical') => {
    switch (level) {
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getBarColor = (level: 'Low' | 'Medium' | 'High' | 'Critical') => {
    switch (level) {
      case 'Low':
        return '#10b981'; // Green
      case 'Medium':
        return '#eab308'; // Yellow
      case 'High':
        return '#f97316'; // Orange
      case 'Critical':
        return '#ef4444'; // Red
    }
  };

  const chartData = stopsData.map((s) => ({
    name: s.stop_name,
    'People waiting': s.current_waiting,
    'In 15 minutes': s.exp_15m,
    'In 30 minutes': s.exp_30m,
    'In 60 minutes': s.exp_60m,
    crowd_level: s.crowd_level,
  }));

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Crowd Forecast & Risk Overview</h2>
              <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full font-mono font-bold">
                DEMO MODE — SIMULATED DATA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Simple passenger waiting count projections and crowd risk levels across key transport stops.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Low</span>
            </span>
            <span className="flex items-center space-x-1 font-bold text-yellow-800 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-200">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
              <span>Medium</span>
            </span>
            <span className="flex items-center space-x-1 font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>High</span>
            </span>
            <span className="flex items-center space-x-1 font-bold text-red-800 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span>Critical</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart: Current & Projected Waiting Passengers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <span>Current & Expected Waiting Passengers by Bus Stop</span>
        </h3>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit=" pax" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} />

              <Bar dataKey="People waiting" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="People waiting" position="top" style={{ fontSize: '11px', fontWeight: 'bold', fill: '#1e293b' }} />
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.crowd_level)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cards Grid: Stop Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stopsData.map((item) => (
          <div
            key={item.stop_id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
          >
            {/* Header row */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-lg font-bold text-slate-900">{item.stop_name}</h4>
                <span className="text-xs text-slate-500 font-mono">ID: {item.stop_id}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(item.crowd_level)}`}>
                {item.crowd_level} Risk
              </span>
            </div>

            {/* Core Display Values */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">People waiting</span>
                <span className="text-lg font-bold text-slate-900">{item.current_waiting}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Available buses</span>
                <span className="text-lg font-bold text-indigo-700">{item.available_buses}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Est. Wait time</span>
                <span className="text-lg font-bold text-slate-900">{item.est_wait_time_mins} mins</span>
              </div>
            </div>

            {/* Expected Crowding Timeline */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">Expected crowding:</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-white border border-slate-200 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">In 15 minutes</span>
                  <strong className="text-slate-900">{item.exp_15m} pax</strong>
                </div>
                <div className="bg-white border border-slate-200 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">In 30 minutes</span>
                  <strong className="text-slate-900">{item.exp_30m} pax</strong>
                </div>
                <div className="bg-white border border-slate-200 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">In 60 minutes</span>
                  <strong className="text-slate-900">{item.exp_60m} pax</strong>
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl flex items-start space-x-2 text-xs">
              {item.crowd_level === 'Critical' || item.crowd_level === 'High' ? (
                <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="text-indigo-950 block">Recommended Action:</strong>
                <span className="text-indigo-900 leading-snug">{item.recommended_action}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

