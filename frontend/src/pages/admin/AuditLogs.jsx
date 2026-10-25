import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, Search, ArrowLeft, Filter, Activity } from 'lucide-react';

export default function AuditLogs() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Comprehensive security and compliance audit logs
  const [logs] = useState([
    { id: 1, event: 'AWS S3 Document Encrypted & Uploaded', category: 'Storage', user: 'elissa (Patient #101)', time: '2 mins ago', ip: '192.168.1.45', status: 'Success' },
    { id: 2, event: 'Specialist Consultation Scheduled', category: 'Appointments', user: 'Amit Patel', time: '1 hour ago', ip: '192.168.1.88', status: 'Success' },
    { id: 3, event: 'Doctor License Verification Approved', category: 'Compliance', user: 'Admin System', time: '5 hours ago', ip: '10.0.0.12', status: 'Verified' },
    { id: 4, event: 'S3 Zero-Trust Encryption Key Rotation', category: 'Security', user: 'System Cron', time: '1 day ago', ip: 'Internal AWS', status: 'Secure' },
    { id: 5, event: 'Password Recovery Token Dispatched', category: 'Auth', user: 'Rohan Gupta', time: '2 days ago', ip: '192.168.2.14', status: 'Dispatched' },
    { id: 6, event: 'Patient Medical Record Downloaded via Presigned URL', category: 'Storage', user: 'Dr. Rajesh Sharma', time: '3 days ago', ip: '192.168.1.12', status: 'Authorized' }
  ]);

  const categories = ['All', 'Storage', 'Appointments', 'Compliance', 'Security', 'Auth'];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.event.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterType === 'All' || log.category === filterType;
    return matchesSearch && matchesCategory;
  });

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
          <p className="text-teal-100 text-sm mt-1">Immutable log of data access, AWS S3 file transfers, and authentication events.</p>
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

      {/* Logs List Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span>Recorded System Events</span>
          </h3>
          <span className="text-xs bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-full">
            {filteredLogs.length} Entries Matching Filter
          </span>
        </div>

        <div className="space-y-3">
          {filteredLogs.length > 0 ? (
            filteredLogs.map(log => (
              <div key={log.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                      {log.category}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{log.event}</span>
                  </div>
                  <p className="text-slate-500">Triggered by: <strong className="text-slate-700">{log.user}</strong> • IP Address: {log.ip}</p>
                </div>
                
                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px]">
                    {log.status}
                  </span>
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{log.time}</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No matching audit events found</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or category filter.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}