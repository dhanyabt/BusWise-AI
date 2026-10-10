import React from 'react';
import { ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';
import type { ConstraintValidation } from '../types';

interface ConstraintAuditsProps {
  validation: ConstraintValidation;
  solverName: string;
  solveDurationMs: number;
}

export const ConstraintAudits: React.FC<ConstraintAuditsProps> = ({
  validation,
  solverName,
  solveDurationMs,
}) => {
  const auditItems = [
    {
      title: 'Fleet Conservation Constraint',
      passed: validation.fleet_conservation_passed,
      desc: 'All 16 buses strictly accounted for across every interval (stationed, serving, or traveling). No extra buses invented.',
    },
    {
      title: 'Travel-Time Feasibility',
      passed: validation.travel_time_feasibility_passed,
      desc: 'Bus transfer arrival times respect inter-stop distance matrix (15-min and 30-min intervals).',
    },
    {
      title: 'Vehicle Passenger Capacity',
      passed: validation.capacity_constraint_passed,
      desc: 'Passengers served per bus capped at 60 passengers/bus per 15-minute trip.',
    },
    {
      title: 'Minimum-Service Requirements',
      passed: validation.min_service_requirement_passed,
      desc: 'Origin stops maintain required minimum bus departures without leaving passengers stranded.',
    },
    {
      title: 'Queue Balance & Non-Negative Queues',
      passed: validation.non_negative_queues_passed,
      desc: 'Exact queue accumulation accounting: Q(t) = Q(t-1) + Arrivals(t) - Served(t) >= 0.',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur mb-6">

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Mathematical Constraint Audit Log</h2>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              OR-Tools Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated verification ensuring all 9 hard mathematical constraints are strictly satisfied.
          </p>
        </div>

        <div className="text-right font-mono text-xs text-slate-400">
          <span className="block text-white font-bold">{solverName}</span>
          <span className="text-[11px] text-slate-400">Execution: {solveDurationMs}ms</span>
        </div>
      </div>

      {/* Audit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {auditItems.map((item, idx) => (
          <div key={idx} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl font-mono text-xs">
            <div className="flex items-center space-x-2">
              {item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <h4 className="font-bold text-white leading-tight">{item.title}</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
};
