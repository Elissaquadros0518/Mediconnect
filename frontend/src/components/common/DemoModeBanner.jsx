import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DemoModeBanner() {
  const { user, exitDemoMode } = useAuth();
  const navigate = useNavigate();

  if (!import.meta.env.DEV || !user?.isDemo) return null;

  const handleExit = () => {
    exitDemoMode();
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 text-white px-4 py-2 text-xs border-b border-teal-500/30 flex flex-wrap items-center justify-between gap-2 shadow-inner z-50 sticky top-0">
      <div className="flex items-center space-x-2.5">
        <span className="bg-teal-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase flex items-center space-x-1 shadow-sm">
          <Sparkles className="w-3 h-3 text-slate-950" />
          <span>DEMO PREVIEW MODE</span>
        </span>
        <span className="text-teal-100 font-medium hidden md:inline">
          Viewing simulated healthcare data • Live Supabase auth is bypassed in local development
        </span>
        <span className="text-amber-300 font-bold text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>DEMO DATA ONLY</span>
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-[11px] text-teal-300 hidden lg:inline">
          Doctor: Dr. Rajesh Sharma, MD
        </span>
        <button
          onClick={handleExit}
          className="bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-white/10"
        >
          <X className="w-3 h-3" />
          <span>Exit Demo</span>
        </button>
      </div>
    </div>
  );
}

