import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, FileText, Upload, ShieldCheck, Clock, ArrowRight, CheckCircle2, 
  Download, Loader2, PlusCircle, Pill, Stethoscope 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { documentService } from '../../services/documentService';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [appts, docs] = await Promise.all([
          appointmentService.getPatientAppointments(user.id),
          documentService.getPatientDocuments(user.id)
        ]);
        setAppointments(appts);
        setRecords(docs);
      } catch (err) {
        console.error('Error loading patient dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user?.id]);

  const handleDownload = async (documentId, storagePath, title) => {
    try {
      await documentService.downloadDocument(documentId, storagePath, title);
    } catch (err) {
      alert(`Could not download file: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. Top Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-sky-800 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="bg-white/25 backdrop-blur-md text-teal-100 text-xs font-semibold px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>Secure Patient Portal</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Welcome Back, {user?.name || user?.fullName || 'Patient'}
          </h1>
          <p className="text-teal-100 text-sm max-w-2xl leading-relaxed">
            Manage your doctor appointments, view recent prescriptions, access diagnostic lab reports, and keep track of your health updates all in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
          <Link 
            to="/patient/book-appointment"
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg transition text-xs flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book Appointment</span>
          </Link>
          <Link 
            to="/patient/records"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-4 py-2.5 rounded-xl backdrop-blur-md transition text-xs flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>My Medical Files</span>
          </Link>
        </div>
      </div>

      {/* 2. Enhanced Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Upcoming Visits */}
        <div className="relative bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition duration-500 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Visits</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{appointments.length}</p>
              <div className="flex items-center space-x-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-teal-700">Scheduled consultations</span>
              </div>
            </div>
            <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition duration-300 shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Lab & Report Files */}
        <div className="relative bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition duration-500 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Files</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{records.length}</p>
              <div className="flex items-center space-x-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-[11px] font-semibold text-sky-700">Uploaded medical reports</span>
              </div>
            </div>
            <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl group-hover:bg-sky-600 group-hover:text-white transition duration-300 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Active Prescriptions */}
        <div className="relative bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition duration-500 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prescriptions</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">2 <span className="text-sm font-semibold text-slate-500">Meds</span></p>
              <div className="flex items-center space-x-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[11px] font-semibold text-amber-700">Prescribed by Dr. Sharma</span>
              </div>
            </div>
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition duration-300 shadow-sm">
              <Pill className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Account Status */}
        <div className="relative bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition duration-500 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</p>
              <p className="text-lg font-black text-emerald-700 tracking-tight pt-1">Verified </p>
              <div className="flex items-center space-x-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-slate-500">Profile fully updated</span>
              </div>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition duration-300 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Last Recorded Clinical Vitals */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <span>Latest Clinical Checkup Vitals</span>
            </h2>
            <p className="text-xs text-slate-500">Recorded by your doctor during your last hospital visit.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
            Last Visit: Oct 18, 2026
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase">Blood Pressure</p>
            <p className="text-xl font-black text-slate-900 mt-1">120/80 <span className="text-xs font-normal text-slate-500">mmHg</span></p>
            <span className="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Normal</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase">Heart Rate</p>
            <p className="text-xl font-black text-slate-900 mt-1">72 <span className="text-xs font-normal text-slate-500">BPM</span></p>
            <span className="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Normal</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase">Body Temperature</p>
            <p className="text-xl font-black text-slate-900 mt-1">98.6 <span className="text-xs font-normal text-slate-500">°F</span></p>
            <span className="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Normal</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase">Blood Oxygen (SpO2)</p>
            <p className="text-xl font-black text-slate-900 mt-1">98%</p>
            <span className="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Optimal</span>
          </div>
        </div>
      </div>

      {/* 4. Main Content Grid: Upcoming Appointments & Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Col: Upcoming Appointments */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>Upcoming Appointments</span>
              </h2>
              <Link to="/patient/book-appointment" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
                <span>Book New</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p>No scheduled consultations found.</p>
                <Link to="/patient/book-appointment" className="mt-2 inline-block text-teal-600 font-bold hover:underline">
                  Schedule your first visit &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="border border-slate-100 bg-slate-50/70 rounded-2xl p-4 flex justify-between items-center hover:bg-slate-50 transition">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 text-sm block">{apt.doctor}</span>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.date} at {apt.time} ({apt.specialty})</span>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">
                      {apt.status || 'Confirmed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Recent Medical Records */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <span>My Medical Reports & Files</span>
              </h2>
              <Link to="/patient/records" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p>No diagnostic documents uploaded yet.</p>
                <Link to="/patient/records" className="mt-2 inline-block text-sky-600 font-bold hover:underline">
                  Upload medical reports &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {records.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="border border-slate-100 bg-slate-50/70 rounded-2xl p-4 flex justify-between items-center hover:bg-slate-50 transition">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 text-sm block">{rec.title}</span>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.date} • {rec.size || '2.4 MB'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(rec.id, rec.storagePath, rec.title)}
                      className="text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
