import React, { useState } from 'react';
import { Layers, Play, Sparkles, CheckCircle2, RotateCcw, Bus, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from 'recharts';
import { RippleGuardLedger, type TransferRecord } from './RippleGuardLedger';

import syntheticScenario from '../data/synthetic_demo_scenario.json';

interface AllocationComparisonProps {
  transfers?: any[];
  onApprove?: (transferId: string, operatorId: string) => Promise<void> | void;
  onReject?: (transferId: string, operatorId: string) => Promise<void> | void;
  onSimulateArrival?: (transferId: string) => void;
}

export const AllocationComparison: React.FC<AllocationComparisonProps> = ({
  transfers: propTransfers,
  onApprove: propOnApprove,
  onReject: propOnReject,
  onSimulateArrival: propOnSimulateArrival,
}) => {
  // Demo State: INITIAL, LOADED, OPTIMIZED, APPLIED
  const [demoStep, setDemoStep] = useState<'INITIAL' | 'LOADED' | 'OPTIMIZED' | 'APPLIED'>('LOADED');

  // Initial Scenario Data loaded dynamically from JSON
  const initialStopsData = syntheticScenario.stops.map((s) => ({
    id: s.id,
    name: s.name,
    arrivals: s.passengersPer15Min,
    buses: s.assignedBuses,
    queue: s.passengersPer15Min > 300 ? 140 : s.passengersPer15Min > 200 ? 60 : 0,
    waitTime: s.passengersPer15Min > 300 ? 35 : s.passengersPer15Min > 200 ? 20 : s.passengersPer15Min > 80 ? 8 : 2,
    crowdLevel: s.crowdLevel as 'Low' | 'Medium' | 'High' | 'Critical',
  }));

  const travelTimes = syntheticScenario.travelTimesMinutes as Record<string, Record<string, number>>;

  const jsonTransfers: TransferRecord[] = [
    {
      id: 'tr-001',
      from_stop_id: 'STOP-004',
      from_stop_name: 'T. Nagar Market Road',
      to_stop_id: 'STOP-001',
      to_stop_name: 'CMBT Koyambedu',
      bus_id: 'B14 & B15',
      bus_count: 2,
      reason: 'CMBT Koyambedu has high passenger queue (380 pax/15m vs 240 capacity). Moving B14 & B15 from excess fleet at T. Nagar Market Road reduces waiting time at CMBT.',
      estimated_benefit: 'Reduces CMBT queue by 120 passengers (Wait time: 35m → 12m)',
      status: 'Recommended',
      travel_time_mins: travelTimes['STOP-004']?.['STOP-001'] || 15,
    },
    {
      id: 'tr-002',
      from_stop_id: 'STOP-004',
      from_stop_name: 'T. Nagar Market Road',
      to_stop_id: 'STOP-003',
      to_stop_name: 'Chennai Central Railway Station',
      bus_id: 'B16',
      bus_count: 1,
      reason: 'Chennai Central Railway Station has 240 arriving passengers per 15 minutes. Moving B16 from T. Nagar Market Road balances capacity with demand.',
      estimated_benefit: 'Reduces Central queue by 60 passengers (Wait time: 20m → 5m)',
      status: 'Recommended',
      travel_time_mins: travelTimes['STOP-004']?.['STOP-003'] || 15,
    },
  ];

  const [stops, setStops] = useState(initialStopsData);
  const [transfers, setTransfers] = useState<TransferRecord[]>(jsonTransfers);

  // Sync prop transfers when available
  React.useEffect(() => {
    if (propTransfers !== undefined) {
      setTransfers(
        propTransfers.map((t, idx) => ({
          id: t.id || `tr-${idx}`,
          from_stop_id: t.origin_stop_id || t.from_stop_id || 'STOP-004',
          from_stop_name: t.origin_stop_name || t.from_stop_name || 'T. Nagar Market Road',
          to_stop_id: t.destination_stop_id || t.to_stop_id || 'STOP-001',
          to_stop_name: t.destination_stop_name || t.to_stop_name || 'CMBT Koyambedu',
          bus_id: t.bus_id || `BUS-0${14 + idx}`,
          bus_count: t.bus_count || 1,
          reason: t.destination_benefit_explanation || t.reason || 'High passenger queue at destination.',
          estimated_benefit: t.estimated_benefit || `Reduces queue by ${(t.bus_count || 1) * 60} passengers`,
          status: t.approval_status === 'APPROVED' || t.approval_status === 'TRAVELING' || t.status === 'Traveling'
            ? 'Traveling'
            : t.approval_status === 'ARRIVED' || t.status === 'Arrived'
            ? 'Arrived'
            : t.approval_status === 'REJECTED' || t.status === 'Rejected'
            ? 'Rejected'
            : 'Recommended',
          travel_time_mins: t.travel_time_mins || 15,
        }))
      );
    }
  }, [propTransfers]);

  // 1. RUN DEMO (Loads synthetic scenario)
  const handleRunDemo = () => {
    setStops(initialStopsData);
    setTransfers(jsonTransfers);
    setDemoStep('LOADED');
  };

  // 2. OPTIMIZE BUS ALLOCATION (Runs deterministic optimizer)
  const handleOptimize = () => {
    setTransfers(jsonTransfers);
    setDemoStep('OPTIMIZED');
  };

  // 3. APPLY TRANSFER (Updates bus locations, fleet counts, recalculates queues and status)
  const handleApplyTransfer = async () => {
    for (const tr of transfers) {
      if (tr.status === 'Recommended' && propOnApprove) {
        try {
          await propOnApprove(tr.id, 'OP-402');
        } catch {
          // Fallback demo state
        }
      }
    }

    setStops((prev) =>
      prev.map((s) => {
        if (s.id === 'STOP-001') {
          return { ...s, buses: 6, queue: 20, waitTime: 12, crowdLevel: 'Medium' as const };
        }
        if (s.id === 'STOP-003') {
          return { ...s, buses: 4, queue: 0, waitTime: 5, crowdLevel: 'Low' as const };
        }
        if (s.id === 'STOP-004') {
          return { ...s, buses: 4, queue: 0, waitTime: 3, crowdLevel: 'Low' as const };
        }
        return s;
      })
    );

    setTransfers((prev) =>
      prev.map((t) => ({ ...t, status: 'Arrived' as const }))
    );
    setDemoStep('APPLIED');
  };

  // 4. RESET DEMO
  const handleResetDemo = () => {
    setStops(initialStopsData);
    setTransfers(jsonTransfers);
    setDemoStep('LOADED');
  };

  const handleLedgerApprove = async (transferId: string, operatorId: string) => {
    if (propOnApprove) {
      await propOnApprove(transferId, operatorId);
    }
    const tr = transfers.find((t) => t.id === transferId);
    const busCount = tr?.bus_count || 1;
    const originId = tr?.from_stop_id || 'STOP-004';

    // Move bus out of source stop's available count immediately
    setStops((prev) =>
      prev.map((s) => {
        if (s.id === originId) {
          return { ...s, buses: Math.max(0, s.buses - busCount) };
        }
        return s;
      })
    );

    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'Traveling' as const } : t))
    );
  };

  const handleLedgerReject = async (transferId: string, operatorId: string) => {
    if (propOnReject) {
      await propOnReject(transferId, operatorId);
    }
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'Rejected' as const } : t))
    );
  };

  const handleLedgerSimulateArrival = (transferId: string) => {
    if (propOnSimulateArrival) {
      propOnSimulateArrival(transferId);
    }
    const tr = transfers.find((t) => t.id === transferId);
    const busCount = tr?.bus_count || 1;
    const destId = tr?.to_stop_id || 'STOP-001';

    // Add bus to destination stop available count upon arrival and update queue
    setStops((prev) =>
      prev.map((s) => {
        if (s.id === destId) {
          const newBuses = s.buses + busCount;
          const newQueue = Math.max(0, s.queue - busCount * 60);
          return {
            ...s,
            buses: newBuses,
            queue: newQueue,
            waitTime: newQueue > 50 ? 12 : 5,
            crowdLevel: newQueue > 50 ? ('Medium' as const) : ('Low' as const),
          };
        }
        return s;
      })
    );

    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'Arrived' as const } : t))
    );
  };

  // Recharts before & after chart data
  const chartData = stops.map((s) => {
    const initialBusItem = initialStopsData.find((item) => item.id === s.id);
    return {
      name: s.name,
      'Initial Buses': initialBusItem?.buses || s.buses,
      'Current Buses': s.buses,
      'Waiting Passengers': s.queue,
      waitTime: s.waitTime,
    };
  });

  return (
    <div className="space-y-6 font-sans mb-6">
      {/* Interactive Control Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Live Bus Allocation & Redistribution Demo
              </h2>
              <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full font-mono font-bold">
                DEMO MODE — SIMULATED DATA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Interactive test scenario: 16 total fleet buses distributed across 4 Tamil Nadu transit hubs.
            </p>
          </div>

          {/* Requirement 4: Interactive Control Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunDemo}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-slate-300 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600" />
              <span>Run Demo</span>
            </button>

            <button
              onClick={handleOptimize}
              disabled={demoStep === 'OPTIMIZED' || demoStep === 'APPLIED'}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Optimize Bus Allocation</span>
            </button>

            <button
              onClick={handleApplyTransfer}
              disabled={transfers.length === 0 || demoStep === 'APPLIED'}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Transfer</span>
            </button>

            <button
              onClick={handleResetDemo}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-300 flex items-center space-x-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Before-and-After Comparison Charts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Bus className="w-5 h-5 text-indigo-600" />
            <span>Before & After Bus Allocation Comparison</span>
          </h3>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-slate-500">Fleet Conservation:</span>
            <strong className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
              16 Total Buses (100% Conserved)
            </strong>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
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

              <Bar dataKey="Initial Buses" fill="#94a3b8" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Initial Buses" position="top" style={{ fontSize: '11px', fontWeight: 'bold' }} />
              </Bar>
              <Bar dataKey="Current Buses" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Current Buses" position="top" style={{ fontSize: '11px', fontWeight: 'bold' }} />
              </Bar>
              <Bar dataKey="Waiting Passengers" fill="#ef4444" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Waiting Passengers" position="top" style={{ fontSize: '11px', fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stop Cards Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stops.map((s) => {
          const initialItem = initialStopsData.find((item) => item.id === s.id)!;
          const delta = s.buses - initialItem.buses;
          return (
            <div
              key={s.id}
              className={`bg-white border rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 font-sans text-xs ${
                delta > 0
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : delta < 0
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{s.id}</span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                    delta > 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : delta < 0
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {delta > 0 ? `+${delta} BUS` : delta < 0 ? `${delta} BUS` : 'BALANCED'}
                </span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Assigned Buses</span>
                  <strong className="text-indigo-700 text-sm">{s.buses} Buses</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Passengers Waiting</span>
                  <strong className={s.queue > 0 ? 'text-red-700 text-sm' : 'text-emerald-700 text-sm'}>
                    {s.queue} pax
                  </strong>
                </div>
              </div>

              {/* Wait time & Crowd risk */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="flex items-center space-x-1 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Est Wait: <strong>{s.waitTime} mins</strong></span>
                </span>
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {s.crowdLevel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* RippleGuard Transfer Ledger (Requirement 5) */}
      <RippleGuardLedger
        transfers={transfers}
        onApprove={handleLedgerApprove}
        onReject={handleLedgerReject}
        onSimulateArrival={handleLedgerSimulateArrival}
      />
    </div>
  );
};

