import React, { useState } from 'react';
import { Calendar, FileText, Clock, Download, ShieldCheck, Stethoscope } from 'lucide-react';

export default function DoctorDashboard() {
  const [appointments] = useState([
    { id: 1, patient: 'Amit Patel', specialty: 'Cardiology Consultation', date: '2026-11-02', time: '10:30 AM', status: 'Confirmed' }
  ]);

  const [patientRecords] = useState([
    { id: 101, patient: 'Amit Patel', title: 'Chest X-Ray Report', date: '2026-10-15', size: '2.4 MB' }
  ]);

  const handleDownloadRecord = (title) => {
    alert(`Generating secure S3 presigned URL for review: ${title}...`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex justify-between items-center">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center w-max space-x-1.5">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Physician Portal</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Dr. Rajesh Sharma's Dashboard</h1>
          <p className="text-teal-100 text-sm mt-1">Review scheduled appointments and inspect patient AWS S3 documents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 mb-6">
            <Calendar className="w-5 h-5 text-teal-600" />
            <span>Scheduled Consultations</span>
          </h2>
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">{apt.patient}</span>
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
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>Patient Uploaded Vault</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">S3 Encrypted</span>
          </div>
          <div className="space-y-4">
            {patientRecords.map((rec) => (
              <div key={rec.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 text-sm block">{rec.title}</span>
                  <div className="text-xs text-slate-500">
                    Patient: <strong className="text-slate-700">{rec.patient}</strong> • {rec.date} ({rec.size})
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadRecord(rec.title)}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Review File</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}