import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, Search, Filter, CheckCircle2, 
  XCircle, Clock, Stethoscope, User, AlertCircle 
} from 'lucide-react';

export default function AppointmentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Initial mock appointment data across the hospital system
  const [appointments, setAppointments] = useState([
    { id: 1, patientName: 'John Doe', doctorName: 'Dr. Sarah Jenkins', specialty: 'Cardiology', date: '2026-10-28', time: '10:30 AM', status: 'Confirmed' },
    { id: 2, patientName: 'Emma Smith', doctorName: 'Dr. Robert Chen', specialty: 'General Medicine', date: '2026-11-02', time: '02:00 PM', status: 'Pending' },
    { id: 3, patientName: 'Michael Brown', doctorName: 'Dr. Emily Watson', specialty: 'Pediatrics', date: '2026-11-05', time: '11:00 AM', status: 'Confirmed' },
    { id: 4, patientName: 'Sophia Taylor', doctorName: 'Dr. David Miller', specialty: 'Emergency Care', date: '2026-11-06', time: '04:15 PM', status: 'Cancelled' },
  ]);

  const handleUpdateStatus = (id, newStatus) => {
    setAppointments(prev =>
      prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
    );
  };

  // Filter logic based on search term and status filter
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || apt.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Admin Control
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Appointment Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monitor, schedule, and override patient-doctor appointments across departments.</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <CalendarIcon className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-bold text-slate-700">{appointments.length} Total System Visits</span>
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

      {/* Appointments Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Assigned Doctor</th>
                <th className="py-3.5 px-6">Specialty</th>
                <th className="py-3.5 px-6">Date & Time</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-semibold text-slate-900 flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {apt.patientName.charAt(0)}
                      </div>
                      <span>{apt.patientName}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      <div className="flex items-center space-x-1.5">
                        <Stethoscope className="w-4 h-4 text-purple-600" />
                        <span>{apt.doctorName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">
                        {apt.specialty}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.date} • {apt.time}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'Confirmed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : apt.status === 'Pending' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {apt.status === 'Confirmed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {apt.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                        {apt.status === 'Cancelled' && <XCircle className="w-3.5 h-3.5" />}
                        <span>{apt.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {apt.status !== 'Confirmed' && (
                        <button 
                          onClick={() => handleUpdateStatus(apt.id, 'Confirmed')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          Confirm
                        </button>
                      )}
                      {apt.status !== 'Cancelled' && (
                        <button 
                          onClick={() => handleUpdateStatus(apt.id, 'Cancelled')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No appointments match your search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}