import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Search, Filter, CheckCircle2, 
  XCircle, Clock, Stethoscope, User, AlertCircle, Loader2, FileText, Pill 
} from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

export default function AppointmentsManagement() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadDoctorAppointments = async () => {
    setLoading(true);
    try {
      // Fetch appointments specifically assigned to the logged-in doctor
      const data = await appointmentService.getDoctorAppointments({
        doctorId: user?.id,
        search: searchTerm,
        status: statusFilter
      });
      setAppointments(data);
    } catch (err) {
      console.error('Error loading doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadDoctorAppointments();
    }
  }, [user?.id, searchTerm, statusFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await appointmentService.updateAppointmentStatus(id, newStatus);
      setAppointments(prev =>
        prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
      );
      setActionSuccess(`Appointment status successfully updated to ${newStatus}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg border border-teal-700/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <span className="bg-white/10 text-teal-200 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-white/10 inline-flex items-center space-x-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-300" />
              <span>Physician Portal</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Patient Appointments Schedule</h1>
            <p className="text-teal-200/90 text-xs md:text-sm max-w-2xl leading-relaxed">
              Supervise your approved patient consultations, review visit reasons, and update session statuses following administrative clearance.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl flex items-center space-x-3 shrink-0">
            <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">Approved Visits</p>
              <p className="text-xl font-black text-white">{appointments.length} Patients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-semibold flex items-center space-x-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Controls Bar (Search & Filter) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by patient name or visit reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List Container */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center space-x-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>Active Consultation Queue</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Database: appointments (Admin Approved)</span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-400">Loading patient schedule...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-1" />
            <p className="text-sm font-bold text-slate-700">No scheduled appointments found</p>
            <p className="text-xs text-slate-400">Approved bookings from the admin review queue will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div 
                key={apt.id} 
                className="p-4 md:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-slate-50/70 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm md:text-base">
                      {apt.patientName || 'Patient Consultation'}
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                      {apt.consultationType || 'In-Person'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="flex items-center space-x-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.date || apt.appointmentDate}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.time || apt.appointmentTime}</span>
                    </span>
                    {apt.reason && (
                      <>
                        <span>•</span>
                        <span className="text-slate-600 italic">Reason: "{apt.reason}"</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-wrap gap-y-2 pt-2 lg:pt-0">
                  {/* Status Badge */}
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                    (apt.status || '').toUpperCase() === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    (apt.status || '').toUpperCase() === 'COMPLETED' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    ● {apt.status || 'CONFIRMED'}
                  </span>

                  {/* Action Buttons for Doctor */}
                  {(apt.status || '').toUpperCase() !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                      className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 px-3.5 py-1.5 rounded-xl font-bold transition shadow-2xs flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  )}

                  {(apt.status || '').toUpperCase() !== 'CANCELLED' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                      className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 rounded-xl font-bold transition shadow-2xs"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}