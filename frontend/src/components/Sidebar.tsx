import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Layers,
  Sliders,
  ShieldCheck,
  Smartphone,
  Bus,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export type TabType =
  | 'OVERVIEW'
  | 'MAP'
  | 'FORECAST'
  | 'ALLOCATION'
  | 'SIMULATOR'
  | 'RIPPLEGUARD'
  | 'PASSENGER';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  transferCount: number;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  transferCount,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'MAP', label: 'Live Map / Fleet View', icon: <MapPin className="w-4 h-4" /> },
    { id: 'FORECAST', label: 'Demand Forecast', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'ALLOCATION', label: 'Bus Allocation', icon: <Layers className="w-4 h-4" /> },
    { id: 'SIMULATOR', label: 'What-if Simulator', icon: <Sliders className="w-4 h-4" /> },
    {
      id: 'RIPPLEGUARD',
      label: 'RippleGuard Transfer Ledger',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: transferCount > 0 ? transferCount : undefined,
    },
    { id: 'PASSENGER', label: 'Passenger Portal', icon: <Smartphone className="w-4 h-4" /> },
  ];

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-all duration-300 z-50 h-screen ${
          /* Desktop sticky vs Mobile fixed drawer */
          isMobileOpen
            ? 'fixed inset-y-0 left-0 w-64 shadow-2xl flex'
            : 'hidden md:flex sticky top-0'
          } ${isCollapsed && !isMobileOpen ? 'md:w-16' : 'md:w-64'}`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="truncate">
                  <h2 className="font-bold text-white tracking-tight text-sm">BusWise AI</h2>
                  <p className="text-[10px] text-slate-400 font-mono">Control Center v1.0</p>
                </div>
              )}
            </div>

            {/* Desktop Collapse / Mobile Close Button */}
            <div className="flex items-center">
              {/* Mobile Close Button */}
              {isMobileOpen && (
                <button
                  onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                  className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Desktop Collapse Button */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:block p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-all font-semibold ${isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  title={item.label}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className={isActive ? 'text-white' : 'text-indigo-400'}>{item.icon}</span>
                    {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.label}</span>}
                  </div>

                  {(!isCollapsed || isMobileOpen) && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span>Fleet Horizon</span>
              <span className="text-white font-bold">2 Hours (8x15m)</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Fleet Constraint</span>
              <span className="text-emerald-400 font-bold">16 Buses Fixed</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
