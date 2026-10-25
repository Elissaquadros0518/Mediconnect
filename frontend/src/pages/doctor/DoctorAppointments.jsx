import React, { useState } from 'react';
import { 
  Calendar, Clock, User, FileText, CheckCircle2, XCircle, Search, Stethoscope, ShieldCheck, Download 
} from 'lucide-react';

export default function DoctorAppointments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Comprehensive mock appointments state for the doctor
  const [appointments, setAppointments] = useState([
    { 
      id: 1, 
      patientName: 'Amit Patel', 
      age: 42, 
      gender: 'Male', 
      specialty: 'Cardiology Consultation', 
      date: '2026-11-02', 
      time: '10:30 AM', 
      status: 'Confirmed', 
      symptoms: 'Chest tightness and shortness of breath during light physical activity.',
      recordTitle: 'Chest X-Ray Report.pdf'
    },
    { 
      id: 2, 
      patientName: 'Priya Deshmukh', 
      age: 29, 
      gender: 'Female', 
      specialty: 'Routine Checkup', 
      date: '2026-11-02', 
      time: '11:45 AM', 
      status: 'Pending', 
      symptoms: 'Persistent fatigue and routine quarterly blood panel review.',
      recordTitle: 'Blood Panel Complete.pdf'
    },
    { 
      id: 3, 
      patientName: 'Rohan Gupta', 
      age: 55, 
      gender: 'Male', 
      specialty: 'Cardiology Follow-up', 
      date: '2026-10-28', 
      time: '02:00 PM', 
      status: 'Completed', 
      symptoms: 'Post-angioplasty medication adjustment and ECG review.',
      recordTitle: 'ECG Report 2026.pdf'
    }
  ]);

  const handleStatusChange = (id, newStatus) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
    );
    alert(`Appointment status updated to "${newStatus}".`);
  };

  const handleDownloadRecord = (recordTitle) => {
    alert(`Generating secure AWS S3 presigned URL for review: ${recordTitle}...`);
  };

  // Filter logic
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          apt.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || apt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MediConnect Hospital Roster</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Patient Appointments & Consultations</h1>
          <p className="text-teal-100 text-sm mt-1">Manage your appointment queue, review clinical notes, and inspect patient S3 vaults.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center shrink-0">
          <p className="text-xl font-black">{appointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length}</p>
          <p className="text-xs text-teal-200">Active Queue</p>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input 
            type="text"
            placeholder="Search by patient name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1">
          {['All', 'Pending', 'Confirmed', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
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

      {/* Appointments List Grid */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt) => (
            <div key={apt.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              
              {/* Patient Main Info */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl font-bold text-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{apt.patientName}</h3>
                    <p className="text-xs text-slate-500">{apt.gender}, {apt.age} Years • <strong className="text-teal-700">{apt.specialty}</strong></p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.date} at {apt.time}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <button 
                      onClick={() => handleDownloadRecord(apt.recordTitle)} 
                      className="text-sky-600 hover:underline font-semibold flex items-center space-x-1"
                    >
                      <span>{apt.recordTitle}</span>
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 mt-2">
                  <strong>Patient Symptoms / Notes:</strong> {apt.symptoms}
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${
                  apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                  apt.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {apt.status}
                </span>

                <div className="flex items-center space-x-2">
                  {apt.status === 'Pending' && (
                    <button 
                      onClick={() => handleStatusChange(apt.id, 'Confirmed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow transition"
                    >
                      Confirm Visit
                    </button>
                  )}
                  {apt.status !== 'Completed' && (
                    <button 
                      onClick={() => handleStatusChange(apt.id, 'Completed')}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow transition"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No appointments found</h3>
            <p className="text-xs text-slate-500">No scheduled consultations match your current filter criteria.</p>
          </div>
        )}
      </div>

    </div>
  );
}