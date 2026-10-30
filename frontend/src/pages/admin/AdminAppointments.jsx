import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Search, Filter, CheckCircle2, 
  XCircle, Clock, Stethoscope, User, AlertCircle, Loader2 
} from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';

export default function AppointmentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAllAppointmentsAdmin({
        search: searchTerm,
        status: statusFilter
      });
      setAppointments(data);
    } catch (err) {
      console.error('Error loading admin appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [searchTerm, statusFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      if (typeof id === 'string' && id.length > 20) {
        await appointmentService.updateAppointmentStatus(id, newStatus);
      }
      setAppointments(prev =>
        prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
      );
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Admin Control
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Appointment Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monitor, schedule, and override patient-doctor appointments across departments in PostgreSQL.</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-bold text-slate-700">{appointments.length} Hospital Visits</span>
        </div>
      </div>

      {/* Controls Bar (Search & Filter) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search patient, doctor, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Confirmed', 'Pending', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                statusFilter === status 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Grid/List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No appointments found matching your filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                    <span className="text-xs text-slate-400">&bull;</span>
                    <span className="text-xs font-semibold text-teal-700">{apt.doctorName}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.date}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{apt.time}</span>
                    </span>
                    <span className="text-purple-600 font-medium">({apt.specialty})</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    apt.status.toUpperCase() === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                    apt.status.toUpperCase() === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {apt.status}
                  </span>

                  {apt.status.toUpperCase() !== 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'Confirmed')}
                      className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-xl font-semibold transition"
                    >
                      Confirm
                    </button>
                  )}
                  {apt.status.toUpperCase() !== 'CANCELLED' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'Cancelled')}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-xl font-semibold transition"
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