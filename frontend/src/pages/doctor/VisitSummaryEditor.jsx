import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, CheckCircle2, Save, Upload, Pill, Stethoscope, ShieldCheck, Calendar, User 
} from 'lucide-react';

export default function VisitSummaryEditor() {
  const navigate = useNavigate();

  // Form State for Visit Summary
  const [patientName, setPatientName] = useState('Amit Patel (ID: #101)');
  const [consultDate, setConsultDate] = useState('2026-11-02');
  const [diagnosis, setDiagnosis] = useState('Mild Ischemic Heart Disease / Stable Angina');
  const [clinicalNotes, setClinicalNotes] = useState('Patient presented with mild chest tightness during physical exertion. ECG shows normal sinus rhythm with mild ST changes. Advised lifestyle modification and continuation of prescribed statins.');
  const [medications, setMedications] = useState('Atorvastatin 20mg - 1 tablet daily at night\nAspirin 75mg - 1 tablet daily post lunch');
  const [followUpDate, setFollowUpDate] = useState('2026-12-02');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveSummary = (e) => {
    e.preventDefault();
    setSaving(true);

    // Simulate backend submission & S3 encryption sync
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => {
        navigate('/doctor/dashboard');
      }, 1800);
    }, 1200);
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
        <p className="text-teal-100 text-sm mt-1">Draft consultation findings, prescribe medications, and sync encrypted records directly to the patient's S3 vault.</p>
      </div>

      {/* Editor Form Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        {success ? (
          <div className="py-16 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-xl font-extrabold text-slate-900">Summary Saved & Uploaded!</h3>
            <p className="text-sm text-slate-500">The consultation report has been securely encrypted and saved to AWS S3.</p>
          </div>
        ) : (
          <form onSubmit={handleSaveSummary} className="space-y-6">
            
            {/* Patient & Date Meta */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Patient Details
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text"
                    disabled
                    value={patientName}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Consultation Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input 
                    type="date"
                    value={consultDate}
                    onChange={(e) => setConsultDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Primary Diagnosis */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Primary Diagnosis
              </label>
              <input 
                type="text"
                required
                placeholder="e.g., Hypertension, Acute Bronchitis..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Clinical Notes / Findings */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Observations & Notes
              </label>
              <textarea 
                rows="4"
                required
                placeholder="Enter detailed physician notes, symptoms evaluated, and diagnostic insights..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Prescriptions & Medications */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Pill className="w-4 h-4 text-indigo-600" />
                <span>Prescribed Medications & Dosage</span>
              </label>
              <textarea 
                rows="3"
                placeholder="List medications, strength, and frequency (one per line)..."
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Recommended Follow-up Date
              </label>
              <input 
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full sm:w-1/2 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Encrypting & Syncing to S3...' : 'Save & Publish Summary'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}