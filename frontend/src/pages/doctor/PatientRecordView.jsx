import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, FileText, Download, Calendar, Clock, Pill, HeartPulse, Activity, ShieldCheck, Stethoscope 
} from 'lucide-react';

export default function PatientRecordView() {
  const navigate = useNavigate();

  // Mock patient detailed record state
  const [patient, setPatient] = useState({
    id: 101,
    name: 'Amit Patel',
    age: 42,
    gender: 'Male',
    bloodGroup: 'B+',
    contact: '+91 98201 23456',
    email: 'amit.patel@example.com',
    address: 'Cumballa Hill, Mumbai, India',
    emergencyContact: 'Priya Patel (Wife) - +91 98201 65432',
    vitals: {
      heartRate: '78 bpm',
      bloodPressure: '128/84 mmHg',
      bloodOxygen: '98%',
      temperature: '98.6 °F'
    },
    prescriptions: [
      { id: 1, medication: 'Atorvastatin 20mg', dosage: '1 tablet daily at night', prescribedBy: 'Dr. Rajesh Sharma', date: '2026-10-15' },
      { id: 2, medication: 'Aspirin 75mg', dosage: '1 tablet daily post lunch', prescribedBy: 'Dr. Rajesh Sharma', date: '2026-09-20' }
    ],
    reports: [
      { id: 201, title: 'Chest X-Ray Report.pdf', date: '2026-10-15', size: '2.4 MB', uploadedBy: 'Patient Vault' },
      { id: 202, title: 'Complete Blood Count (CBC).pdf', date: '2026-09-30', size: '1.1 MB', uploadedBy: 'MediConnect Labs' },
      { id: 203, title: 'ECG Report 2026.pdf', date: '2026-08-10', size: '3.5 MB', uploadedBy: 'Dr. Rajesh Sharma' }
    ]
  });

  const handleDownloadS3File = (reportTitle) => {
    alert(`Generating secure AWS S3 presigned URL for clinical review: ${reportTitle}... Download will begin shortly.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      
      {/* Back Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Appointments / Dashboard</span>
      </button>

      {/* Patient Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-inner">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
              Patient ID: #{patient.id}
            </span>
            <h1 className="text-2xl md:text-3xl font-black">{patient.name}</h1>
            <p className="text-teal-100 text-xs mt-0.5">
              {patient.gender} • {patient.age} Years • Blood Group: <strong className="text-white">{patient.bloodGroup}</strong>
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl text-xs space-y-1">
          <p className="text-teal-200 uppercase font-bold text-[10px]">Emergency Contact</p>
          <p className="font-semibold text-white">{patient.emergencyContact}</p>
        </div>
      </div>

      {/* Vitals Quick Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Heart Rate</p>
            <p className="text-lg font-extrabold text-slate-900">{patient.vitals.heartRate}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Pressure</p>
            <p className="text-lg font-extrabold text-slate-900">{patient.vitals.bloodPressure}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Oxygen</p>
            <p className="text-lg font-extrabold text-slate-900">{patient.vitals.bloodOxygen}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Temperature</p>
            <p className="text-lg font-extrabold text-slate-900">{patient.vitals.temperature}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Reports Vault & Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: S3 Medical Reports Vault */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>Medical Reports Vault (AWS S3)</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Encrypted at Rest</span>
          </div>

          <div className="space-y-3">
            {patient.reports.map((rep) => (
              <div key={rep.id} className="border border-slate-100 bg-slate-50/60 rounded-xl p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 text-sm block">{rep.title}</span>
                  <p className="text-xs text-slate-500">Uploaded: {rep.date} • Source: {rep.uploadedBy} ({rep.size})</p>
                </div>
                <button 
                  onClick={() => handleDownloadS3File(rep.title)}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Review File</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Prescriptions History */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Pill className="w-5 h-5 text-indigo-600" />
              <span>Prescription History</span>
            </h2>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">
              {patient.prescriptions.length} Active Rx
            </span>
          </div>

          <div className="space-y-3">
            {patient.prescriptions.map((rx) => (
              <div key={rx.id} className="border border-slate-100 bg-slate-50/60 rounded-xl p-4 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{rx.medication}</span>
                  <span className="text-[11px] text-slate-400 font-medium">{rx.date}</span>
                </div>
                <p className="text-xs text-slate-600">Dosage: <strong className="text-slate-800">{rx.dosage}</strong></p>
                <p className="text-[11px] text-teal-700 font-medium pt-1">Prescribed by: {rx.prescribedBy}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}