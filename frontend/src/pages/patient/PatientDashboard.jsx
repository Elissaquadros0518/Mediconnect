import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, FileText, Upload, ShieldCheck, Clock, Plus, ArrowRight, UserCheck, Stethoscope, CheckCircle2 
} from 'lucide-react';

export default function PatientDashboard() {
  // Mock upcoming appointments state
  const [appointments, setAppointments] = useState([
    { id: 1, doctor: 'Dr. Sarah Jenkins', specialty: 'Cardiology Specialist', date: '2026-11-02', time: '10:30 AM', status: 'Confirmed' }
  ]);

  // Mock patient medical records state
  const [records, setRecords] = useState([
    { id: 101, title: 'Chest X-Ray Report', date: '2026-10-15', doctor: 'Dr. Sarah Jenkins', size: '2.4 MB' },
    { id: 102, title: 'Blood Panel Complete', date: '2026-09-30', doctor: 'Dr. Robert Chen', size: '1.1 MB' }
  ]);

  const handleBookAppointment = () => {
    alert('Redirecting to Doctor Directory & Scheduling module...');
  };

  const handleDownload = (title) => {
    alert(`Generating secure S3 presigned URL for: ${title}...`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center w-max space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Patient Vault</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Welcome Back, Patient</h1>
          <p className="text-teal-100 text-sm mt-1">Manage your health records, view scheduled appointments, and consult specialists securely.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            to="/patient/records"
            className="bg-white text-teal-700 font-semibold px-4 py-2.5 rounded-xl shadow hover:bg-teal-50 transition text-sm flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Manage Records</span>
          </Link>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Upcoming Visits</p>
            <p className="text-2xl font-extrabold text-slate-900">{appointments.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Stored Reports</p>
            <p className="text-2xl font-extrabold text-slate-900">{records.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Account Status</p>
            <p className="text-sm font-extrabold text-emerald-700 mt-1">Verified & Active</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Upcoming Appointments & Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Col: Upcoming Appointments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>Upcoming Appointments</span>
              </h2>
              <Link to="/doctors" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
                <span>Book New</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <div key={apt.id} className="border border-slate-100 bg-slate-50/60 rounded-xl p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block">{apt.doctor}</span>
                      <p className="text-xs text-slate-500">{apt.specialty}</p>
                      <div className="text-xs text-slate-400 flex items-center space-x-1.5 pt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.date} at {apt.time}</span>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                      {apt.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No upcoming appointments booked.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Recent Medical Reports */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <span>Recent Medical Reports</span>
              </h2>
              <Link to="/patient/records" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1">
                <span>View All Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {records.map((rec) => (
                <div key={rec.id} className="border border-slate-100 bg-slate-50/60 rounded-xl p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 text-sm block">{rec.title}</span>
                    <p className="text-xs text-slate-500">Attending: {rec.doctor} • {rec.date} ({rec.size})</p>
                  </div>
                  <button 
                    onClick={() => handleDownload(rec.title)}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-700 px-3.5 py-2 rounded-xl transition text-xs font-semibold shrink-0"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Need to add new diagnostic files?</span>
            <Link 
              to="/patient/records"
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Report</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}