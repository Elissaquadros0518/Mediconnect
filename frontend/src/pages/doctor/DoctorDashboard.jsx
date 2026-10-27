import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Clock, Download, ShieldCheck, Stethoscope, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { documentService } from '../../services/documentService';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const patientRecords = [
    { id: 101, patient: 'Amit Patel', title: 'Chest X-Ray Report.pdf', date: '2026-10-15', size: '2.4 MB' },
    { id: 102, patient: 'Priya Deshmukh', title: 'Complete Blood Count.pdf', date: '2026-09-30', size: '1.1 MB' }
  ];

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

  const handleDownloadRecord = async (title) => {
    alert(`Generating secure Supabase Storage presigned URL for review: ${title}...`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex justify-between items-center">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center w-max space-x-1.5">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Physician Portal</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">
            {user?.name ? `${user.name}'s Dashboard` : "Doctor's Dashboard"}
          </h1>
          <p className="text-teal-100 text-sm mt-1">Review scheduled appointments and inspect patient diagnostic documents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scheduled Consultations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 mb-6">
            <Calendar className="w-5 h-5 text-teal-600" />
            <span>Scheduled Consultations</span>
          </h2>
          
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No consultations scheduled for today.
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">{apt.patientName}</span>
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

        {/* Patient Vault */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>Patient Uploaded Vault</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Supabase Storage</span>
          </div>

          <div className="space-y-4">
            {patientRecords.map((rec) => (
              <div key={rec.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">{rec.title}</span>
                  <div className="text-xs text-slate-500 flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Patient: {rec.patient} • {rec.date} ({rec.size})</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadRecord(rec.title)}
                  className="text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Review</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}