import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface DemoBannerProps {
  isDemoMode: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ isDemoMode }) => {
  return (
    <div className="bg-amber-500/10 border-y border-amber-500/20 py-2 px-4 text-amber-300 flex items-center justify-between text-xs sm:text-sm font-mono tracking-wide">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
        <span className="font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
          DEMO DATA — NOT LIVE
        </span>
        <span className="hidden md:inline text-amber-200/80">
          Showing 4 fictional festival bus stops & 16 fictional buses over 2-hour planning horizon (8 x 15min intervals).
        </span>
      </div>
      <div className="flex items-center space-x-2 text-amber-400/90 text-xs">
        <Info className="w-3.5 h-3.5" />
        <span>{isDemoMode ? 'Standalone Demo Mode' : 'Connected to FastAPI & OR-Tools'}</span>
      </div>
    </div>
  );
};
