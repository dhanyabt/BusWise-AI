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
  session,
  onNavigate,
  isOptimizing,
  onRunOptimization,
}) => {
  const featureCards = [
    {
      id: 'MAP' as TabType,
      title: 'Live Map & GIS Tracking',
      icon: <MapPin className="w-6 h-6 text-indigo-600" />,
      borderHover: 'hover:border-indigo-400 hover:shadow-indigo-100',
    },
    {
      id: 'FLEET' as TabType,
      title: 'Fleet & Routes Management',
      icon: <Bus className="w-6 h-6 text-blue-600" />,
      borderHover: 'hover:border-blue-400 hover:shadow-blue-100',
    },
    {
      id: 'DEMAND_FORECAST' as TabType,
      title: 'Passenger Demand Forecast',
      icon: <TrendingUp className="w-6 h-6 text-amber-600" />,
      borderHover: 'hover:border-amber-400 hover:shadow-amber-100',
    },
    {
      id: 'OPTIMIZER' as TabType,
      title: 'AI Fleet Optimizer',
      icon: <Layers className="w-6 h-6 text-emerald-600" />,
      borderHover: 'hover:border-emerald-400 hover:shadow-emerald-100',
    },
    {
      id: 'SIMULATOR' as TabType,
      title: 'What-If Scenario Simulator',
      icon: <Sliders className="w-6 h-6 text-purple-600" />,
      borderHover: 'hover:border-purple-400 hover:shadow-purple-100',
    },
    {
      id: 'PASSENGER' as TabType,
      title: 'Trip Planner & Trip Tracker',
      icon: <Navigation className="w-6 h-6 text-cyan-600" />,
      borderHover: 'hover:border-cyan-400 hover:shadow-cyan-100',
    },
    {
      id: 'EVENTS' as TabType,
      title: 'Alerts & Reports',
      icon: <ShieldCheck className="w-6 h-6 text-rose-600" />,
      borderHover: 'hover:border-rose-400 hover:shadow-rose-100',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Operations Ribbon with Persistent DEMO MODE Indicator */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Public Transport Control Center
              </h1>
              {/* Persistent Demo Data Indicator (Item 6) */}
              <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full font-mono font-bold tracking-wide">
                DEMO MODE — SIMULATED DATA
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Welcome, <strong>{session.name}</strong> ({session.role}) • Tamil Nadu Transit Operations • Select a module below to open
            </p>
          </div>

          <button
            onClick={onRunOptimization}
            disabled={isOptimizing}
            className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold font-mono transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-sm self-start lg:self-center"
          >
            <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizing Solver...' : 'Run Fleet Optimizer'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid of 7 Module Cards (Simplified as per Requirement 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {featureCards.map((card) => (
          <div
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className={`group bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer flex items-center justify-between ${card.borderHover}`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:scale-105 transition-transform">
                {card.icon}
              </div>
              <h2 className="text-base font-bold text-slate-900 group-hover:text-pink-600 transition-colors tracking-tight">
                {card.title}
              </h2>
            </div>

            <div className="p-2 text-slate-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
