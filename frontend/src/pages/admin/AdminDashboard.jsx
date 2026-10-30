import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Users, UserCheck, Calendar, FileText, ArrowRight, Activity, Server, AlertCircle, Loader2 
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    patientCount: 1248,
    doctorCount: 42,
    appointmentCount: 86,
    systemUptime: '99.98%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      try {
        const data = await adminService.getSystemMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Error loading admin metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-10 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Supabase Master Control</span>
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">System Administration Hub</h1>
          <p className="text-teal-100 text-sm max-w-xl">
            Monitor hospital operations, manage specialist doctor rosters, track Supabase PostgreSQL storage health, and inspect system audit trails.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shrink-0">
          <p className="text-2xl font-black text-emerald-300">{metrics.systemUptime}</p>
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
            <p className="text-2xl font-black text-slate-900">{metrics.patientCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Active Specialists</p>
            <p className="text-2xl font-black text-slate-900">{metrics.doctorCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Hospital Visits</p>
            <p className="text-2xl font-black text-slate-900">{metrics.appointmentCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Database Engine</p>
            <p className="text-sm font-extrabold text-emerald-700 mt-1">Supabase PostgreSQL</p>
          </div>
        </div>
      </div>

      {/* Quick Access Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Link 
          to="/admin/doctors" 
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-3 group"
        >
          <div className="flex justify-between items-center">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition">
              <UserCheck className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 transition" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">Doctor Verification</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Inspect pending doctor registrations, verify medical licenses, and approve public profiles.
          </p>
        </Link>

        <Link 
          to="/admin/appointments" 
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-3 group"
        >
          <div className="flex justify-between items-center">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl group-hover:bg-sky-600 group-hover:text-white transition">
              <Calendar className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">Appointment Supervision</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Manage system-wide patient-doctor bookings and override appointment statuses across departments.
          </p>
        </Link>

        <Link 
          to="/admin/audit-logs" 
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-3 group"
        >
          <div className="flex justify-between items-center">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">Security Audit Logs</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review immutable audit records of logins, file transfers, and administrative actions.
          </p>
        </Link>

      </div>

    </div>
  );
}