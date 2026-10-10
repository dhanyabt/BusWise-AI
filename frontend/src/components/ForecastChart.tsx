import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import type { ForecastResponse } from '../types';

interface ForecastChartProps {
  forecast: ForecastResponse;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecast }) => {
  const [selectedStopId, setSelectedStopId] = useState<string>('ALL');

  if (!forecast || !forecast.stops_forecast || forecast.stops_forecast.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur mb-6 text-center">
        <TrendingUp className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-pulse" />
        <p className="text-white font-bold text-sm">Demand Forecast Unavailable</p>
        <p className="text-xs text-slate-400 mt-1">Awaiting 2-hour festival arrival stream from forecasting engine.</p>
      </div>
    );
  }

  // Format Recharts data across 8 intervals (T0..T7)
  const intervalsCount = 8;
  const chartData = Array.from({ length: intervalsCount }, (_, idx) => {
    const timeLabel = `T+${idx * 15}m`;
    const row: Record<string, any> = { time: timeLabel };

    forecast.stops_forecast.forEach((sf) => {
      row[sf.stop_name] = sf.intervals[idx]?.arrivals || 0;
    });
    return row;
  });

  const stopColors: Record<string, string> = {
    'Main Stand': '#db2777',      // Pink/Magenta
    'Temple Road': '#0284c7',     // Sky Blue
    'Railway Station': '#7c3aed', // Purple
    'Market Road': '#059669',     // Emerald
  };

  // Check if any interval exceeds surge threshold (>150 pax)
  const maxArrival = Math.max(
    ...forecast.stops_forecast.flatMap((s) => s.intervals.map((i) => i.arrivals || 0))
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">2-Hour Passenger Demand Forecast</h2>
            <span className="text-[10px] bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded font-mono font-bold">
              15-Min Intervals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Predicted passenger arrival rates across 4 festival stops over the 2-hour planning horizon (T0..T7).
          </p>
        </div>

        {/* Model Evaluation Metric & Filter */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* MAE Metric Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center space-x-2 text-emerald-800 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-[10px] text-emerald-700 block leading-tight font-medium">EVALUATION MAE</span>
              <span className="font-bold text-emerald-950 leading-tight">{forecast.evaluation_mae} pax</span>
            </div>
          </div>

          {/* Filter Dropdown */}
          <select
            value={selectedStopId}
            onChange={(e) => setSelectedStopId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs font-mono cursor-pointer"
            aria-label="Filter forecast by stop"
          >
            <option value="ALL">All 4 Bus Stops</option>
            {forecast.stops_forecast.map((sf) => (
              <option key={sf.stop_id} value={sf.stop_id}>
                {sf.stop_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Surge Threshold Alert Banner */}
      {maxArrival >= 150 && (
        <div className="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Critical Surge Detected: Peak interval arrivals reach {maxArrival} pax/15m. Fixed fleet redistribution recommended.
          </span>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-[320px] w-full mt-5 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {Object.entries(stopColors).map(([name, color]) => (
                <linearGradient key={name} id={`grad-${name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={1} />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} tick={{ fill: '#64748b' }} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tick={{ fill: '#64748b' }} unit=" pax" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.75rem',
                color: '#0f172a',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontFamily: 'monospace' }} />

            {/* High Surge Reference Line */}
            <ReferenceLine y={150} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Surge Threshold (150 pax)', fill: '#d97706', fontSize: 10, position: 'top' }} />

            {forecast.stops_forecast.map((sf) => {
              if (selectedStopId !== 'ALL' && selectedStopId !== sf.stop_id) return null;
              const color = stopColors[sf.stop_name] || '#db2777';
              return (
                <Area
                  key={sf.stop_id}
                  type="monotone"
                  dataKey={sf.stop_name}
                  stroke={color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#grad-${sf.stop_name.replace(/\s+/g, '')})`}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Peak Summary Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 border-t border-slate-200 pt-4 text-xs">
        {forecast.stops_forecast.map((sf) => (
          <div key={sf.stop_id} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
            <span className="text-slate-500 font-mono text-[10px] uppercase block">{sf.stop_name}</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-bold text-slate-900 font-mono">{sf.total_2h_arrivals} pax</span>
              <span className="text-[10px] text-pink-700 font-mono font-bold">Peak T+{sf.peak_interval_index * 15}m</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Chronological evaluation over festival demand curve with 15-minute granularity</span>
      </div>
    </div>
  );
};
