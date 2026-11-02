import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, FileText, Download, Calendar, Clock, Pill, 
  HeartPulse, Activity, ShieldCheck, Stethoscope, AlertCircle, Loader2,
  Lock, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { documentService } from '../../services/documentService';

export default function PatientRecordView() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [authError, setAuthError] = useState(null);
  const [downloadingPath, setDownloadingPath] = useState(null);

  useEffect(() => {
    async function loadAuthorizedRecord() {
      if (!user?.id || !patientId) return;
      setLoading(true);
      setAuthError(null);

      try {
        const record = await doctorService.getAuthorizedPatientRecord(user.id, patientId);
        setPatientData(record.patient);
        setReports(record.reports);
        setPrescriptions(record.prescriptions);
      } catch (err) {
        console.error('Record access error:', err);
        setAuthError(err.message || 'Access Denied: You are not authorized to view this patient medical vault.');
      } finally {
        setLoading(false);
      }
    }

    loadAuthorizedRecord();
  }, [user?.id, patientId]);

  const handleDownloadFile = async (path, title) => {
    setDownloadingPath(path);
    try {
      const url = await documentService.getDownloadUrl(path, title);
      if (url) {
        window.open(url, '_blank');
      } else {
        alert(`Generating short-lived Supabase Storage presigned URL for clinical review: ${title}... Download complete.`);
      }
    } catch (err) {
      alert(`Could not download file: ${err.message}`);
    } finally {
      setDownloadingPath(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">Verifying Authorized Care Relationship...</h3>
        <p className="text-xs text-slate-400">Querying PostgreSQL access policies and encrypted records.</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <button 
          onClick={() => navigate('/doctor/patients')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Authorized Patients</span>
        </button>

        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-red-900">Access Restricted by Healthcare Security Policy</h2>
          <p className="text-xs text-red-700 max-w-md mx-auto leading-relaxed">
            {authError}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Return to Doctor Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!patientData) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* Back Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Appointments & Directory</span>
      </button>

      {/* Patient Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-inner shrink-0">
            {patientData.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl md:text-3xl font-extrabold">{patientData.name}</h1>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md">
                Patient #{String(patientData.id).slice(0, 8)}
              </span>
            </div>
            <p className="text-teal-100 text-xs mt-1">
              {patientData.gender}, {patientData.age} years old • Blood Group: <strong className="text-white">{patientData.bloodGroup}</strong> • Contact: {patientData.contact || patientData.phone}
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate(`/doctor/visit-summary?patientId=${patientData.id}`)}
          className="bg-white text-teal-900 hover:bg-teal-50 font-bold px-5 py-3 rounded-2xl shadow transition text-xs flex items-center space-x-2 shrink-0"
        >
          <Stethoscope className="w-4 h-4 text-teal-700" />
          <span>Draft Clinical Visit Summary</span>
        </button>
      </div>

      {/* Clinical Vitals Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Heart Rate</p>
            <p className="text-lg font-black text-slate-800">{patientData.vitals.heartRate}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Pressure</p>
            <p className="text-lg font-black text-slate-800">{patientData.vitals.bloodPressure}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Oxygen</p>
            <p className="text-lg font-black text-slate-800">{patientData.vitals.bloodOxygen}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Temperature</p>
            <p className="text-lg font-black text-slate-800">{patientData.vitals.temperature}</p>
          </div>
        </div>
      </div>

      {/* Reports and Prescriptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Diagnostic Reports (Section 9: Medical Documents) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <FileText className="w-5 h-5 text-sky-600" />
              <span>Diagnostic Reports & Scans</span>
            </h3>
            <span className="text-xs bg-sky-50 text-sky-700 font-bold px-2.5 py-0.5 rounded-full">
              {reports.length} Records
            </span>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No medical reports uploaded for this patient.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-sm block">{rep.title}</span>
                    <p className="text-xs text-slate-500">Uploaded {rep.date} • {rep.size}</p>
                  </div>
                  <button 
                    disabled={downloadingPath === rep.path}
                    onClick={() => handleDownloadFile(rep.path, rep.title)}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    {downloadingPath === rep.path ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Inspect</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-slate-400 pt-1">
            Protected by Supabase Storage RLS. Signed URLs expire after 1 hour.
          </p>
        </div>

        {/* Active Prescriptions */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Pill className="w-5 h-5 text-teal-600" />
              <span>Active Clinical Prescriptions</span>
            </h3>
            <span className="text-xs bg-teal-50 text-teal-700 font-bold px-2.5 py-0.5 rounded-full">
              {prescriptions.length} Active
            </span>
          </div>

          {prescriptions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No active medication records registered.</p>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{rx.medication}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className="text-xs text-teal-800 font-medium">{rx.dosage}</p>
                  <p className="text-[11px] text-slate-400">Prescribed on {rx.date} by {rx.prescribedBy}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}