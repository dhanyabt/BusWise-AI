import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Layers,
  Sliders,
  ShieldCheck,
  Bus,
  ChevronLeft,
  ChevronRight,
  X,
  Navigation,
  UserCheck,
} from 'lucide-react';
import type { UserSession } from './AuthModal';

export type TabType =
  | 'DASHBOARD'
  | 'MAP'
  | 'FLEET'
  | 'FORECAST'
  | 'OPTIMIZER'
  | 'SIMULATOR'
  | 'TRIP_PLANNER'
  | 'ALERTS_REPORTS';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  transferCount: number;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  session?: UserSession;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  transferCount,
  isMobileOpen = false,
  setIsMobileOpen,
  session,
  onOpenAuthModal,
}) => {
  const userRole = session?.role || 'OFFICER';

  const allNavItems: {
    id: TabType;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    roles?: string[];
  }[] = [
      { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'MAP', label: 'Live Map', icon: <MapPin className="w-4 h-4" /> },
      { id: 'FLEET', label: 'Fleet & Routes', icon: <Bus className="w-4 h-4" /> },
      { id: 'FORECAST', label: 'Demand Forecast', icon: <TrendingUp className="w-4 h-4" /> },
      {
        id: 'OPTIMIZER',
        label: 'AI Optimizer',
        icon: <Layers className="w-4 h-4" />,
        roles: ['OFFICER', 'POLICE'],
      },
      {
        id: 'SIMULATOR',
        label: 'What-If Simulator',
        icon: <Sliders className="w-4 h-4" />,
        roles: ['OFFICER'],
      },
      {
        id: 'TRIP_PLANNER',
        label: 'Trip Planner / Trip Tracker',
        icon: <Navigation className="w-4 h-4" />,
        roles: ['PASSENGER', 'OFFICER'],
      },
      {
        id: 'ALERTS_REPORTS',
        label: 'Alerts & Reports',
        icon: <ShieldCheck className="w-4 h-4" />,
        badge: transferCount > 0 ? transferCount : undefined,
        roles: ['OFFICER', 'POLICE'],
      },
    ];

  // Filter items based on active role permissions
  const navItems = allNavItems.filter((item) => !item.roles || item.roles.includes(userRole));

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
        className={`bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between transition-all duration-300 z-50 h-screen shadow-sm ${isMobileOpen
          ? 'fixed inset-y-0 left-0 w-64 shadow-2xl flex'
          : 'hidden md:flex sticky top-0'
          } ${isCollapsed && !isMobileOpen ? 'md:w-16' : 'md:w-64'}`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl text-white shadow-md shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="truncate">
                  <h2 className="font-bold text-slate-900 tracking-tight text-sm">BusWise AI</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Control Center v1.0</p>
                </div>
              )}
            </div>

            <div className="flex items-center">
              {isMobileOpen && (
                <button
                  onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                  className="md:hidden p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:block p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* User Role Card */}
          {(!isCollapsed || isMobileOpen) && session && (
            <div className="p-3 mx-2 mt-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center space-x-2 truncate">
                <UserCheck className="w-4 h-4 text-pink-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-900 block text-[11px] truncate">{session.name}</span>
                  <span className="text-[10px] text-slate-500 block">{session.role} Role</span>
                </div>
              </div>
              {onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="text-[10px] bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-700 px-2 py-0.5 rounded border border-slate-200 transition-colors shrink-0 font-bold"
                >
                  Switch
                </button>
              )}
            </div>
          )}

          {/* Navigation Items */}
          <nav className="p-2 space-y-1 mt-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-all font-semibold ${isActive
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  title={item.label}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                    {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.label}</span>}
                  </div>

                  {(!isCollapsed || isMobileOpen) && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-pink-50 text-pink-700 border border-pink-200'
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

        {/* Profile and Role-Appropriate Settings Footer */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-3.5 border-t border-slate-200 text-xs bg-slate-50/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">User Profile</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-100 text-pink-700 font-mono">
                {userRole}
              </span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
              <div className="font-bold text-slate-800 text-xs truncate">{session?.name || 'Authorized Operator'}</div>
              <div className="text-[10px] text-slate-500 truncate font-mono">{session?.email || 'operator@buswise.ai'}</div>
              {session?.badge_number && (
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Badge: {session.badge_number}</div>
              )}
            </div>

            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold font-mono transition-all active:scale-95 shadow-2xs"
              >
                <span>Profile &amp; Role Settings</span>
              </button>
            )}

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60">
              <span>Fleet Constraint:</span>
              <strong className="text-slate-700">16 Buses Fixed</strong>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
