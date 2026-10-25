import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Users, UserCheck, Calendar, FileText, ArrowRight, Activity, Server, AlertCircle 
} from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-10 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Master Control</span>
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">System Administration Hub</h1>
          <p className="text-teal-100 text-sm max-w-xl">
            Monitor hospital operations, manage specialist doctor rosters, track AWS S3 storage health, and inspect system audit trails.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shrink-0">
          <p className="text-2xl font-black text-emerald-300">99.98%</p>
          <p className="text-xs text-teal-200">System Uptime</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Registered Patients</p>
            <p className="text-2xl font-black text-slate-900">1,248</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Active Specialists</p>
            <p className="text-2xl font-black text-slate-900">42</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Today's Visits</p>
            <p className="text-2xl font-black text-slate-900">86</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">AWS S3 Vault</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">Encrypted</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Link to="/admin/appointments" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl w-max">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition">Appointment Oversight</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inspect all scheduled patient visits across departments, filter by status, and override bookings if needed.
            </p>
          </div>
          <div className="pt-4 flex items-center space-x-1 text-xs font-bold text-teal-600 group-hover:translate-x-1 transition mt-4">
            <span>Manage Appointments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link to="/admin/doctors" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl w-max">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition">Doctor Management</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review physician license credentials, approve new specialist registrations, and configure campus assignments.
            </p>
          </div>
          <div className="pt-4 flex items-center space-x-1 text-xs font-bold text-sky-600 group-hover:translate-x-1 transition mt-4">
            <span>Manage Roster</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link to="/admin/audit-logs" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition group flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl w-max">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">Security & Audit Logs</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Examine immutable system event logs, AWS S3 token exchanges, and access security compliance reports.
            </p>
          </div>
          <div className="pt-4 flex items-center space-x-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition mt-4">
            <span>View Audit Trail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

      </div>

    </div>
  );
}