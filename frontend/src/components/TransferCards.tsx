import React from 'react';
import { ArrowRight, Bus, CheckCircle, ShieldAlert, Sparkles, Clock } from 'lucide-react';
import type { TransferCard } from '../types';

interface TransferCardsProps {
  transfers: TransferCard[];
}

export const TransferCards: React.FC<TransferCardsProps> = ({ transfers }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm mb-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-pink-600 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">OR-Tools Transfer Recommendations</h2>
            <span className="text-[10px] bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded font-mono font-semibold">
              {transfers.length} Actionable Transfers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimal bus redistribution schedules explaining why every recommended move is beneficial for destination and origin stops.
          </p>
        </div>
      </div>

      {/* Recommendations Grid */}
      {transfers.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl my-4 bg-slate-50/50">
          <Bus className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-700 font-semibold text-sm">No Transfers Required</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Current bus allocation perfectly balances passenger demand across all festival stops under this scenario.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {transfers.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 hover:border-pink-300 rounded-xl p-4 shadow-xs transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              {/* Transfer Vector Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1">
                    <Bus className="w-3.5 h-3.5" />
                    <span>{t.bus_id || `${t.bus_count} BUSES`}</span>
                  </span>
                  <span className="text-xs text-slate-600 font-mono">
                    Dispatch: <strong className="text-slate-900">{t.dispatch_time_label}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-600 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3 text-purple-600" />
                  <span>Arrive: {t.arrival_time_label}</span>
                </div>
              </div>

              {/* Origin -> Destination Banner */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono">
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">ORIGIN STOP</span>
                  <span className="text-sm font-bold text-slate-900">{t.origin_stop_name}</span>
                </div>
                <div className="p-2 bg-pink-100 rounded-full text-pink-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">DESTINATION STOP</span>
                  <span className="text-sm font-bold text-pink-700">{t.destination_stop_name}</span>
                </div>
              </div>

              {/* Explanations Section */}
              <div className="space-y-2 text-xs">
                {/* Destination Benefit */}
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-start space-x-2 text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] uppercase tracking-wider text-emerald-900">
                      Destination Benefit
                    </strong>
                    <span className="text-xs">{t.destination_benefit_explanation}</span>
                  </div>
                </div>

                {/* Origin Impact */}
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-start space-x-2 text-slate-700">
                  <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] uppercase tracking-wider text-slate-500">
                      Origin Service Impact
                    </strong>
                    <span className="text-xs">{t.origin_impact_explanation}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
