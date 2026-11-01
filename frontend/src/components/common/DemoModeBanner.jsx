import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, X, AlertTriangle, Stethoscope, User, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function DemoModeBanner() {
  const { user, exitDemoMode, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!import.meta.env.DEV || !user?.isDemo) return null;

  const handleExit = () => {
    exitDemoMode();
    navigate('/login', { replace: true });
  };

  const handleSwitch = (role, targetPath) => {
    switchDemoRole(role);
    navigate(targetPath);
  };

  const currentRole = user?.role?.toLowerCase();

  return (
    <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 text-white px-4 py-2 text-xs border-b border-teal-500/30 flex flex-wrap items-center justify-between gap-2 shadow-inner z-50 sticky top-0">
      <div className="flex items-center space-x-2.5">
        <span className="bg-teal-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase flex items-center space-x-1 shadow-sm">
          <Sparkles className="w-3 h-3 text-slate-950" />
          <span>DEMO PREVIEW MODE</span>
        </span>
        <span className="text-amber-300 font-bold text-[10px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>SIMULATED DATA ONLY</span>
        </span>
        <span className="text-teal-200 font-semibold text-[11px] hidden sm:inline">
          Persona: <strong className="text-white">{user.name}</strong> ({currentRole.toUpperCase()})
        </span>
      </div>

      {/* Quick Role Switcher */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 bg-white/10 p-0.5 rounded-xl border border-white/10 text-[10px] font-bold">
          <button
            onClick={() => handleSwitch('doctor', '/doctor/dashboard')}
            className={`px-2 py-1 rounded-lg transition flex items-center space-x-1 ${
              currentRole === 'doctor' ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-teal-200 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3 h-3" />
            <span>Doctor</span>
          </button>

          <button
            onClick={() => handleSwitch('patient', '/patient/profile')}
            className={`px-2 py-1 rounded-lg transition flex items-center space-x-1 ${
              currentRole === 'patient' ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-teal-200 hover:text-white'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Patient</span>
          </button>

          <button
            onClick={() => handleSwitch('admin', '/admin/dashboard')}
            className={`px-2 py-1 rounded-lg transition flex items-center space-x-1 ${
              currentRole === 'admin' ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-teal-200 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Admin</span>
          </button>
        </div>

        <button
          onClick={handleExit}
          className="bg-white/10 hover:bg-white/20 text-teal-100 hover:text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-white/10"
          title="Exit Demo Mode"
        >
          <X className="w-3 h-3" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </div>
  );
}
