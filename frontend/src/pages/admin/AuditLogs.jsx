import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, Search, ArrowLeft, Filter, Activity, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AuditLogs() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Storage', 'Appointments', 'Compliance', 'Security', 'Auth'];

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const data = await adminService.getAuditLogs({
          search: searchTerm,
          category: filterType
        });
        setLogs(data);
      } catch (err) {
        console.error('Error loading audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [searchTerm, filterType]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/admin/dashboard')}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Dashboard</span>
      </button>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compliance & Security</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Security Audit Trails</h1>
          <p className="text-teal-100 text-sm mt-1">Immutable log of data access, Supabase Storage file transfers, and authentication events in PostgreSQL.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center shrink-0">
          <p className="text-xl font-black">100%</p>
          <p className="text-xs text-teal-200">Traceability</p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input 
            type="text"
            placeholder="Search audit logs by event description or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterType === cat
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading audit trail records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No audit records found matching your filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/50 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{log.event}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">
                      {log.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Initiated by: <strong className="text-slate-700">{log.user}</strong> &bull; IP: {log.ip}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.time}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}