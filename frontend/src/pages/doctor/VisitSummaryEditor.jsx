import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, CheckCircle2, Save, Pill, Stethoscope, ShieldCheck, Calendar, User, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { visitSummaryService } from '../../services/visitSummaryService';

export default function VisitSummaryEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State for Visit Summary
  const [patientName, setPatientName] = useState('Amit Patel (ID: #101)');
  const [consultDate, setConsultDate] = useState('2026-11-02');
  const [diagnosis, setDiagnosis] = useState('Mild Ischemic Heart Disease / Stable Angina');
  const [clinicalNotes, setClinicalNotes] = useState('Patient presented with mild chest tightness during physical exertion. ECG shows normal sinus rhythm with mild ST changes. Advised lifestyle modification and continuation of prescribed statins.');
  const [medications, setMedications] = useState('Atorvastatin 20mg - 1 tablet daily at night\nAspirin 75mg - 1 tablet daily post lunch');
  const [followUpDate, setFollowUpDate] = useState('2026-12-02');
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveSummary = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      await visitSummaryService.saveSummary({
        appointmentId: '11111111-2222-3333-4444-555555555555',
        doctorId: user?.id,
        patientId: 'patient-demo-id',
        summary: clinicalNotes,
        diagnosis,
        medications,
        followUpDate,
        isPublished: true
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/doctor/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Save summary error:', err);
      setErrorMsg(err.message || 'Unable to save visit summary.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      
      {/* Back Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Clinical Documentation</span>
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Visit Summary & Prescription Editor</h1>
        <p className="text-teal-100 text-sm mt-1">Draft consultation findings, prescribe medications, and publish encrypted records directly to the patient's vault.</p>
      </div>

      {/* Editor Form Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        {success ? (
          <div className="py-16 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-xl font-extrabold text-slate-900">Summary Published Successfully!</h3>
            <p className="text-sm text-slate-500">The consultation findings and prescription have been published to the patient's Supabase medical vault.</p>
          </div>
        ) : (
          <form onSubmit={handleSaveSummary} className="space-y-6">
            
            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Patient & Date Meta */}
            <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Patient</label>
                <div className="flex items-center space-x-2 font-bold text-slate-800">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>{patientName}</span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Consultation Date</label>
                <div className="flex items-center space-x-2 font-bold text-slate-800">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>{consultDate}</span>
                </div>
              </div>
            </div>

            {/* Primary Diagnosis */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Diagnosis
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Clinical Observations / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Doctor's Observations & Findings
              </label>
              <textarea 
                rows={4}
                required
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Medications & Prescription */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                <span>Prescribed Medications & Dosage</span>
              </label>
              <textarea 
                rows={3}
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Recommended Follow-up Review Date
              </label>
              <input 
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button 
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <span>Publishing Summary...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Publish Consultation Summary to Patient Vault</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
}