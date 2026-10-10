import React from 'react';
import { Cpu, Database, RefreshCw, Activity, AlertTriangle, Menu } from 'lucide-react';

interface HeaderProps {
  apiStatus: { healthy: boolean; message: string; is_demo: boolean };
  onRefresh: () => void;
  isRefreshing: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiStatus,
  onRefresh,
  isRefreshing,
  onToggleMobileMenu,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 py-3 px-4 sm:px-6 shadow-xl sticky top-0 z-30 backdrop-blur-md bg-slate-900/95">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title and Branding */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Hamburger Button */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                BusWise AI <span className="text-slate-400 font-normal text-sm sm:text-base">| Transport Control Center</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                Fixed Fleet (16)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Festival Crowd Prediction & MILP Redistribution Dashboard
            </p>
          </div>
        </div>

        {/* Prominent Demo Warning & Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Prominent Demo Badge — Always Visible as Requested */}
          <div className="flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/40 px-3 py-1 rounded-lg text-amber-300 font-mono font-bold text-[11px] shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span>DEMO DATA — NOT LIVE</span>
          </div>

          {/* OR-Tools Engine Status */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-300 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>OR-Tools CBC</span>
          </div>

          {/* Database State */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 border rounded-lg px-2.5 py-1 text-[11px] font-mono ${!apiStatus.is_demo
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
              }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>{!apiStatus.is_demo ? 'Live DB' : 'Demo Mode'}</span>
          </div>

          {/* Backend Connection State */}
          <div
            className={`flex items-center space-x-1.5 border rounded-lg px-2.5 py-1 text-[11px] font-mono ${apiStatus.healthy
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
          >
            <Activity className={`w-3.5 h-3.5 shrink-0 ${apiStatus.healthy ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
            <span>{apiStatus.healthy ? 'API Connected' : 'Offline (Fallback Active)'}</span>
          </div>

          {/* Refresh Action Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all active:scale-95 disabled:opacity-50"
            title="Refresh System Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
