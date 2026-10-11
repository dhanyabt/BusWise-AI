import React from 'react';
import { Database, RefreshCw, Activity, AlertTriangle, Menu, UserCheck } from 'lucide-react';
import type { UserSession } from './AuthModal';

interface HeaderProps {
  apiStatus: { healthy: boolean; message: string; is_demo: boolean };
  onRefresh: () => void;
  isRefreshing: boolean;
  onToggleMobileMenu?: () => void;
  session?: UserSession;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiStatus,
  onRefresh,
  isRefreshing,
  onToggleMobileMenu,
  session,
  onOpenAuthModal,
}) => {
  const roleLabel = session?.role || 'OFFICER';

  return (
    <header className="bg-white/95 border-b border-slate-200 text-slate-800 py-3 px-4 sm:px-6 shadow-sm sticky top-0 z-30 backdrop-blur-md">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title and Branding */}
        <div className="flex items-center space-x-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                BusWise AI <span className="text-slate-500 font-normal text-sm sm:text-base">| Public Transport Control</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded font-mono">
                Gov-Grade System
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              AI Crowd Prediction, Multi-Role Access & Fixed-Fleet Bus Redistribution
            </p>
          </div>
        </div>

        {/* Status Pills & Role Trigger */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Prominent Demo Warning */}
          <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-lg text-amber-900 font-mono font-bold text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>DEMO MODE — SIMULATED DATA</span>
          </div>

          {/* User Role Access Pill */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center space-x-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 px-3 py-1 rounded-lg font-mono font-bold text-[11px] transition-all active:scale-95 shadow-sm"
              title="Click to switch role (Passenger / Officer / Police)"
            >
              <UserCheck className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              <span>ROLE: {roleLabel}</span>
            </button>
          )}

          {/* Database State */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 border rounded-lg px-2.5 py-1 text-[11px] font-mono ${!apiStatus.is_demo
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span>{!apiStatus.is_demo ? 'Live DB' : 'Demo Mode'}</span>
          </div>

          {/* Backend Connection State */}
          <div
            className={`flex items-center space-x-1.5 border rounded-lg px-2.5 py-1 text-[11px] font-mono ${apiStatus.healthy
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
          >
            <Activity className={`w-3.5 h-3.5 shrink-0 ${apiStatus.healthy ? 'text-emerald-600' : 'text-rose-600'}`} />
            <span>{apiStatus.healthy ? 'API Connected' : 'Offline'}</span>
          </div>

          {/* Refresh Action Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-all active:scale-95 disabled:opacity-50"
            title="Refresh System Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-pink-600' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
