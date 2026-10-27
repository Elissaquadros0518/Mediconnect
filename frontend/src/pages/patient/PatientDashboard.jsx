import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, FileText, Upload, ShieldCheck, Clock, ArrowRight, CheckCircle2, Download, Loader2 
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

  const handleDownload = async (storagePath, title) => {
    try {
      const url = await documentService.getDownloadUrl(storagePath);
      if (url) {
        window.open(url, '_blank');
      } else {
        alert(`Downloaded encrypted sample vault record: ${title}`);
      }
    } catch (err) {
      alert(`Could not download file: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center w-max space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Supabase Patient Vault</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">
            Welcome Back, {user?.name || 'Patient'}
          </h1>
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
            <p className="text-sm font-extrabold text-emerald-700 mt-1">
              {user?.accountStatus === 'ACTIVE' ? 'Verified & Active' : user?.accountStatus || 'Active'}
            </p>
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
              <div className="py-10 text-center text-slate-400 text-xs">
                No scheduled consultations found.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 text-sm block">{apt.doctor}</span>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.date} at {apt.time} ({apt.specialty})</span>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Recent Medical Records */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <span>Recent Records & Vault</span>
              </h2>
              <Link to="/patient/records" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
                <span>View Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
              </div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No diagnostic documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {records.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 text-sm block">{rec.title}</span>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.date} • {rec.size}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(rec.storagePath, rec.title)}
                      className="text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition"
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