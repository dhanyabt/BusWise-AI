import React from 'react';
import { Sparkles, Brain, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { ForecastResponse, OptimizationResponse } from '../types';

interface AIExplainabilityCardProps {
  forecast: ForecastResponse;
  optimization: OptimizationResponse;
}

export const AIExplainabilityCard: React.FC<AIExplainabilityCardProps> = ({
  forecast,
  optimization,
}) => {
  const peakStop = forecast.stops_forecast.reduce((max, sf) =>
    sf.total_2h_arrivals > max.total_2h_arrivals ? sf : max
    , forecast.stops_forecast[0]);

  const transferCount = optimization.transfers.length;
  const criticalCount = forecast.stops_forecast.filter((s) =>
    s.intervals.some((i) => i.risk_level === 'CRITICAL' || i.risk_level === 'HIGH')
  ).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 font-sans">
      <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
        <Brain className="w-5 h-5 text-pink-600" />
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          AI Operational Risk Summary & Trade-off Explanation
        </h3>
        <span className="text-[10px] bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded font-mono font-bold">
          Generative Summary
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs font-sans leading-relaxed">
        {/* 1. Demand & Risk Forecast Insight */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
          <div className="flex items-center space-x-1.5 text-pink-700 font-bold font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-pink-600 shrink-0" />
            <span>1. DEMAND SURGE ANALYSIS</span>
          </div>
          <p className="text-slate-700">
            Peak passenger arrival surge is projected at <strong className="text-slate-900">{peakStop.stop_name}</strong> with <strong className="text-pink-700">{peakStop.total_2h_arrivals} pax</strong> over the 2-hour window. {criticalCount} of 4 stops exhibit elevated crowd risk levels during concert exit intervals.
          </p>
        </div>

        {/* 2. MILP Solver Trade-Off Rationale */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
          <div className="flex items-center space-x-1.5 text-emerald-800 font-bold font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>2. REDISTRIBUTION RATIONALE</span>
          </div>
          <p className="text-slate-700">
            Google OR-Tools solver identified <strong className="text-emerald-700">{transferCount} transfer vector(s)</strong>. Fleet relocation moves excess capacity from low-demand feeder stops while strictly maintaining minimum service limits (&ge; 1 bus/interval).
          </p>
        </div>

        {/* 3. Operational Safety & Service Impact */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
          <div className="flex items-center space-x-1.5 text-amber-800 font-bold font-mono text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>3. GOVERNANCE & SAFETY</span>
          </div>
          <p className="text-slate-700">
            Recommended bus dispatches absorb up to <strong className="text-amber-800">120 passengers/transfer</strong> before queue thresholds are breached. Operator review logs timestamps before dispatches are committed to live schedules.
          </p>
        </div>
      </div>
    </div>
  );
};
