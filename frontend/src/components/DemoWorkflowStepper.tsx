import React from 'react';
import {
  Sparkles,
  Users,
  TrendingUp,
  AlertTriangle,
  Play,
  ArrowRight,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface DemoWorkflowStepperProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  onRunOptimization: () => void;
  isOptimizing: boolean;
}

export const DemoWorkflowStepper: React.FC<DemoWorkflowStepperProps> = ({
  currentStep,
  onSelectStep,
  onRunOptimization,
  isOptimizing,
}) => {
  const steps = [
    {
      step: 1,
      title: 'Initial Queues',
      desc: 'Baseline 16-bus allocation & stop queues',
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      step: 2,
      title: 'Demand Curve',
      desc: '2-Hour predicted passenger arrivals',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      step: 3,
      title: 'Identify Risk',
      desc: 'Main Stand stage exit peak detected',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    {
      step: 4,
      title: 'Run Optimizer',
      desc: 'Solve OR-Tools time-expanded MILP',
      icon: <Play className="w-3.5 h-3.5" />,
    },
    {
      step: 5,
      title: 'Redistribution',
      desc: 'Actionable bus transfer vectors',
      icon: <ArrowRight className="w-3.5 h-3.5" />,
    },
    {
      step: 6,
      title: 'Allocation Shift',
      desc: 'Before vs After fleet allocation',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      step: 7,
      title: 'Audit & Ledger',
      desc: 'RippleGuard trade-off verification',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-pink-600" />
          <h3 className="font-bold text-slate-900 tracking-tight font-sans text-sm">
            Interactive Demonstration Workflow Guide
          </h3>
          <span className="text-[10px] bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded font-mono font-bold">
            7-Step Evaluation Path
          </span>
        </div>

        <button
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Play className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'Solving MILP...' : 'Step 4: Execute Optimizer'}</span>
        </button>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-3">
        {steps.map((item) => {
          const isActive = currentStep === item.step;
          const isPast = currentStep > item.step;
          return (
            <button
              key={item.step}
              onClick={() => onSelectStep(item.step)}
              className={`p-2.5 rounded-xl border text-left transition-all ${isActive
                ? 'bg-pink-50 border-pink-500 text-pink-900 shadow-sm ring-1 ring-pink-500/50'
                : isPast
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold flex items-center space-x-1 ${isActive ? 'text-pink-700' : 'text-slate-500'}`}>
                  <span>STEP {item.step}</span>
                  {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />}
                </span>
                <span className={isActive ? 'text-pink-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
              </div>
              <div className="font-bold font-sans text-xs text-slate-900 truncate">
                {item.title}
              </div>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-tight line-clamp-1">
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
