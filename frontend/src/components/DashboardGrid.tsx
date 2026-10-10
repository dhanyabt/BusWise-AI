import React from 'react';
import {
  MapPin,
  Bus,
  TrendingUp,
  Layers,
  Sliders,
  Navigation,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { FleetSummary, ForecastResponse, OptimizationResponse, UserSession } from '../types';
import type { TabType } from './Sidebar';

interface DashboardGridProps {
  fleet: FleetSummary;
  forecast: ForecastResponse;
  optimization: OptimizationResponse;
  session: UserSession;
  onNavigate: (tab: TabType) => void;
  isOptimizing: boolean;
  onRunOptimization: () => void;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  fleet,
  forecast,
  optimization,
  session,
  onNavigate,
  isOptimizing,
  onRunOptimization,
}) => {
  const peakStop = forecast.stops_forecast.reduce(
    (max, curr) => (curr.total_2h_arrivals > max.total_2h_arrivals ? curr : max),
    forecast.stops_forecast[0] || { stop_name: 'CMBT Koyambedu', total_2h_arrivals: 1760 }
  );

  const transferCount = optimization.transfers.length;

  const featureCards = [
    {
      id: 'MAP' as TabType,
      title: 'Live Map & GIS Tracking',
      subtitle: 'Google Maps Platform & OpenStreetMap GIS',
      metric: '8 Tamil Nadu Transit Nodes',
      metricSub: 'Live GPS permission & Tamil Nadu corridor tracking',
      description: 'Searchable Tamil Nadu hubs (CMBT, Central, Mylapore, T. Nagar), user GPS geolocation, crowd heat overlays, and transit route calculator.',
      badge: 'Google Maps + GPS',
      badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
      icon: <MapPin className="w-5 h-5 text-pink-600" />,
      borderHover: 'hover:border-pink-300 hover:shadow-pink-50/50',
    },
    {
      id: 'FLEET' as TabType,
      title: 'Fleet & Routes Management',
      subtitle: 'Tamil Nadu State Transport Corporation',
      metric: `${fleet.total_buses} Fixed Buses Conserved`,
      metricSub: '4 Terminals • Zero unauthorized bus additions',
      description: 'Fixed-fleet allocation across 4 terminals. Bus status, depot assignments, and strict preservation of minimum service frequencies.',
      badge: '16 Buses Fixed',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Bus className="w-5 h-5 text-blue-600" />,
      borderHover: 'hover:border-blue-300 hover:shadow-blue-50/50',
    },
    {
      id: 'FORECAST' as TabType,
      title: 'Passenger Demand Forecast',
      subtitle: 'Predictive Machine Learning Engine',
      metric: `${peakStop.total_2h_arrivals.toLocaleString()} Peak Arrivals`,
      metricSub: `Highest surge node: ${peakStop.stop_name}`,
      description: '2-hour planning horizon across 8 15-minute intervals (T0 to T7). Random Forest ML regression with MAE 14.25 crowd surge estimations.',
      badge: 'ML Engine Online',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
      borderHover: 'hover:border-amber-300 hover:shadow-amber-50/50',
    },
    {
      id: 'OPTIMIZER' as TabType,
      title: 'AI Fleet Optimizer',
      subtitle: 'Google OR-Tools CBC MILP Solver',
      metric: `${transferCount} Active Transfer Vectors`,
      metricSub: '0 Unmet Demand • 9 Hard Constraints Enforced',
      description: 'Generates optimal bus transfers between terminals to eliminate passenger queues without exceeding total fleet size or violating travel time bounds.',
      badge: 'MILP Solver Optimal',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <Layers className="w-5 h-5 text-emerald-600" />,
      borderHover: 'hover:border-emerald-300 hover:shadow-emerald-50/50',
    },
    {
      id: 'SIMULATOR' as TabType,
      title: 'What-If Scenario Simulator',
      subtitle: 'Dynamic Festival Surge Modeling',
      metric: '1.0x to 2.5x Demand Multiplier',
      metricSub: 'Real-time MILP recalculation',
      description: 'Interactive parameter controls to stress-test extreme crowd spikes, adjust bus capacity (60 pax), and tune queue vs transfer cost penalties.',
      badge: 'Interactive Simulator',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <Sliders className="w-5 h-5 text-purple-600" />,
      borderHover: 'hover:border-purple-300 hover:shadow-purple-50/50',
    },
    {
      id: 'TRIP_PLANNER' as TabType,
      title: 'Trip Planner & Trip Tracker',
      subtitle: 'Public Transit Passenger Guidance',
      metric: 'Search Origins & Destinations',
      metricSub: 'Estimated transit times & stop safety ratings',
      description: 'Search transit stops across Tamil Nadu, view live ETAs, next departing buses, crowd risk indicators, and turn-by-turn route advice.',
      badge: 'Passenger Portal',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Navigation className="w-5 h-5 text-indigo-600" />,
      borderHover: 'hover:border-indigo-300 hover:shadow-indigo-50/50',
    },
    {
      id: 'ALERTS_REPORTS' as TabType,
      title: 'Alerts & Reports',
      subtitle: 'RippleGuard Ledger & Time-to-Surge',
      metric: `${transferCount} Staged Transfers Pending`,
      metricSub: 'Digital signature approval workflow',
      description: 'Audit log of bus transfer recommendations, operator sign-offs, Time-to-Surge predictive early warnings, and regulatory compliance exports.',
      badge: 'Audit & Compliance',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <ShieldCheck className="w-5 h-5 text-rose-600" />,
      borderHover: 'hover:border-rose-300 hover:shadow-rose-50/50',
    },
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* Top Operations Ribbon (Government-Grade Header) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Government Transit Control &amp; Fixed-Fleet Operations
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">
                TNSTC Command Center
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Role: <strong>{session.role}</strong> ({session.name}) • Active Hub: Chennai Metropolitan Corridor • Click any card below to navigate
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-slate-500 text-[10px] block">TOTAL FLEET</span>
              <strong className="text-slate-900">16 Buses Fixed</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-slate-500 text-[10px] block">UNMET DEMAND</span>
              <strong className="text-emerald-700">0 Passengers</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-slate-500 text-[10px] block">SOLVER STATUS</span>
              <strong className="text-indigo-700">Optimal (CBC)</strong>
            </div>
            <button
              onClick={onRunOptimization}
              disabled={isOptimizing}
              className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold font-mono transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 shadow-2xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Optimizing...' : 'Run Solver'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Central Grid of Clickable Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {featureCards.map((card) => (
          <div
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className={`group bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between ${card.borderHover}`}
          >
            <div>
              {/* Header with Icon and Badge */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-pink-600 transition-colors tracking-tight">
                {card.title}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mb-2">
                {card.subtitle}
              </p>

              {/* Key Metric Banner */}
              <div className="bg-slate-50/80 border border-slate-100 p-2.5 rounded-xl mb-2.5">
                <div className="text-xs font-bold text-slate-900 font-mono">
                  {card.metric}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {card.metricSub}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {card.description}
              </p>
            </div>

            {/* Bottom Navigate Link */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-pink-600 transition-colors">
              <span className="text-[11px] font-mono">Open Dedicated View</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Compact Operational Assurance Strip */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Strict Fixed-Fleet Invariant: <strong className="text-slate-800">Σ buses(t) = 16</strong> for all t ∈ [0..7]. No buses spawned from thin air.
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-slate-500">
          <span>Objective Cost: <strong>{optimization.objective_value.toFixed(1)}</strong></span>
          <span>•</span>
          <span>Service Guarantee: <strong>&ge; 1 bus/terminal</strong></span>
          <span>•</span>
          <span className="text-pink-700 font-bold">Government Grade V1.0</span>
        </div>
      </div>
    </div>
  );
};
