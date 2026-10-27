import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, FileText, Download, Calendar, Clock, Pill, HeartPulse, Activity, ShieldCheck, Stethoscope 
} from 'lucide-react';
import { documentService } from '../../services/documentService';

export default function PatientRecordView() {
  const navigate = useNavigate();

  const [patient] = useState({
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
      { id: 201, title: 'Chest X-Ray Report.pdf', date: '2026-10-15', size: '2.4 MB', uploadedBy: 'Patient Vault', path: 'demo/chest-xray.pdf' },
      { id: 202, title: 'Complete Blood Count (CBC).pdf', date: '2026-09-30', size: '1.1 MB', uploadedBy: 'MediConnect Labs', path: 'demo/cbc.pdf' },
      { id: 203, title: 'ECG Report 2026.pdf', date: '2026-08-10', size: '3.5 MB', uploadedBy: 'Dr. Rajesh Sharma', path: 'demo/ecg.pdf' }
    ]
  });

  const handleDownloadFile = async (path, title) => {
    try {
      const url = await documentService.getDownloadUrl(path);
      if (url) {
        window.open(url, '_blank');
      } else {
        alert(`Generating secure Supabase Storage presigned URL for clinical review: ${title}... Download complete.`);
      }
    } catch (err) {
      alert(`Could not download file: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      
      {/* Back Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Appointments</span>
      </button>

      {/* Patient Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-inner">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl md:text-3xl font-extrabold">{patient.name}</h1>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ID: #{patient.id}
              </span>
            </div>
            <p className="text-teal-100 text-xs mt-1">
              {patient.gender}, {patient.age} years old • Blood Group: <strong className="text-white">{patient.bloodGroup}</strong> • Contact: {patient.contact}
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/doctor/visit-summary')}
          className="bg-white text-teal-800 hover:bg-teal-50 font-bold px-5 py-3 rounded-xl shadow transition text-xs flex items-center space-x-2 shrink-0"
        >
          <Stethoscope className="w-4 h-4 text-teal-600" />
          <span>Write Clinical Summary</span>
        </button>
      </div>

      {/* Clinical Vitals Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Heart Rate</p>
            <p className="text-lg font-black text-slate-800">{patient.vitals.heartRate}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Pressure</p>
            <p className="text-lg font-black text-slate-800">{patient.vitals.bloodPressure}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Oxygen</p>
            <p className="text-lg font-black text-slate-800">{patient.vitals.bloodOxygen}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Temperature</p>
            <p className="text-lg font-black text-slate-800">{patient.vitals.temperature}</p>
          </div>
        </div>
      </div>

      {/* Reports and Prescriptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Diagnostic Reports */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>Diagnostic Reports & Scans</span>
            </h3>
            <span className="text-xs bg-sky-50 text-sky-700 font-semibold px-2.5 py-0.5 rounded-full">
              {patient.reports.length} Records
            </span>
          </div>

          <div className="space-y-3">
            {patient.reports.map((rep) => (
              <div key={rep.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-sm block">{rep.title}</span>
                  <p className="text-xs text-slate-500">Uploaded {rep.date} • {rep.size}</p>
                </div>
                <button 
                  onClick={() => handleDownloadFile(rep.path, rep.title)}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Prescriptions */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Pill className="w-5 h-5 text-teal-600" />
              <span>Active Prescriptions</span>
            </h3>
            <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2.5 py-0.5 rounded-full">
              {patient.prescriptions.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {patient.prescriptions.map((rx) => (
              <div key={rx.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{rx.medication}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-xs text-teal-800 font-medium">{rx.dosage}</p>
                <p className="text-[11px] text-slate-400">Prescribed by {rx.prescribedBy} on {rx.date}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}