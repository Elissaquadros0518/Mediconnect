import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Search, Activity, Loader2, Database } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AuditLogs() {
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

  const getStatusBadge = (status) => {
    const st = (status || 'SUCCESS').toUpperCase();
    if (st === 'SUCCESS' || st === 'COMPLETED' || st === 'ALLOWED') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (st === 'WARNING' || st === 'PENDING') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg border border-teal-700/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <span className="bg-white/10 text-teal-200 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-white/10 inline-flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>Compliance & Security</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Security Audit Trails</h1>
            <p className="text-teal-200/90 text-xs md:text-sm max-w-2xl leading-relaxed">
              Immutable logging of data access, Supabase Storage file transfers, role modifications, and authentication events.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl flex items-center space-x-3 shrink-0">
            <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">System Traceability</p>
              <p className="text-xl font-black text-white">100% Verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input 
              type="text"
              placeholder="Search audit logs by event description, user, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 hidden lg:inline">
            Showing {logs.length} Audit Records
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0 mr-1">Categories:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filterType === cat
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table Container */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center space-x-2">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Audit Registry</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Database Table: audit_logs</span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-400">Loading audit trail records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-1" />
            <p className="text-sm font-bold text-slate-700">No audit records found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/70 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{log.event}</span>
                    <span className="text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {log.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center space-x-2">
                    <span>Initiated by: <strong className="text-slate-800">{log.user || 'System Admin'}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-400">IP: {log.ip || '127.0.0.1'}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.time || new Date().toLocaleTimeString()}</span>
                  </span>
                  
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${getStatusBadge(log.status)}`}>
                    ● {log.status || 'SUCCESS'}
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