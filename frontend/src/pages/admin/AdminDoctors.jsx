import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldCheck, Stethoscope, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDoctorRoster();
      setDoctors(data);
    } catch (err) {
      console.error('Error loading doctor roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminService.approveDoctor(id);
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, status: 'Active' } : d));
      setSuccessMsg('Doctor credentials verified and approved for public booking!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(`Could not approve doctor: ${err.message}`);
    }
  };

  const handleRemove = (id) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex justify-between items-center">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Admin Verification Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Doctor Roster & Credentials</h1>
          <p className="text-teal-100 text-sm mt-1">Verify medical council licenses and approve specialist onboarding in Supabase.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-2xl border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Registered Physicians ({doctors.length})</h3>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading doctor roster...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doctors.map(doc => (
              <div key={doc.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{doc.name}</span>
                  <p className="text-xs text-slate-500">{doc.specialty} • License: {doc.license}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    doc.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {doc.status}
                  </span>
                  {doc.status === 'Pending Review' && (
                    <button 
                      onClick={() => handleApprove(doc.id)} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                    >
                      Approve Doctor
                    </button>
                  )}
                  <button 
                    onClick={() => handleRemove(doc.id)} 
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                    title="Remove record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}