import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, FileText, CheckCircle2, XCircle, Search, Stethoscope, ShieldCheck, Download, Loader2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';

export default function DoctorAppointments() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await appointmentService.getDoctorAppointments(user.id);
        setAppointments(data);
      } catch (err) {
        console.error('Error loading doctor appointments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [user?.id]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await appointmentService.updateAppointmentStatus(id, newStatus);
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
      );
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  const handleDownloadRecord = (recordTitle) => {
    alert(`Generating secure Supabase Storage presigned URL for review: ${recordTitle}...`);
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.symptoms.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || apt.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Physician Schedule & Triage</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Patient Consultations</h1>
          <p className="text-teal-100 text-sm mt-1">Review scheduled appointments, inspect clinical symptoms, and manage consultation statuses.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
          <p className="text-xl font-bold">{appointments.length}</p>
          <p className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">Total Consultations</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text"
            placeholder="Search patient name, condition, or symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === status 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Roster of Consultations ({filteredAppointments.length})</h3>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading appointments from Supabase...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No consultations matched your search criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => (
              <div key={apt.id} className="border border-slate-100 bg-slate-50/60 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 text-teal-800 rounded-xl flex items-center justify-center font-bold text-sm">
                      {apt.patientName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{apt.patientName}</span>
                      <p className="text-xs text-slate-500">{apt.gender}, {apt.age} yrs • {apt.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      apt.status.toUpperCase() === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                      apt.status.toUpperCase() === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      apt.status.toUpperCase() === 'COMPLETED' ? 'bg-sky-100 text-sky-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                  <strong className="text-slate-800">Reported Symptoms:</strong> {apt.symptoms}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-xs">
                  <div className="flex items-center space-x-3 text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.date}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.time}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusChange(apt.id, 'Confirmed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs transition"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleStatusChange(apt.id, 'Completed')}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs transition"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleStatusChange(apt.id, 'Cancelled')}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl font-semibold text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}