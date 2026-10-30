import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, FileText, CheckCircle2, Save, Pill, Stethoscope, 
  ShieldCheck, Calendar, User, AlertCircle, Loader2, Clock, Send, Edit3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { visitSummaryService } from '../../services/visitSummaryService';
import { appointmentService } from '../../services/appointmentService';

export default function VisitSummaryEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const paramAppointmentId = searchParams.get('appointmentId');
  const paramPatientId = searchParams.get('patientId');

  // Appointment selection state
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(paramAppointmentId || '');
  const [currentAppointment, setCurrentAppointment] = useState(null);

  // Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medications, setMedications] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Existing summaries list
  const [pastSummaries, setPastSummaries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  // Load doctor's appointments and summaries
  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [appts, summaries] = await Promise.all([
          appointmentService.getDoctorAppointments(user.id),
          visitSummaryService.getDoctorSummaries(user.id)
        ]);

        setDoctorAppointments(appts);
        setPastSummaries(summaries);

        // If an appointment was passed in URL or pick first available
        const targetId = paramAppointmentId || (appts.length > 0 ? appts[0].id : '');
        setSelectedAppointmentId(targetId);

        if (targetId) {
          const matched = appts.find(a => a.id === targetId);
          if (matched) {
            setCurrentAppointment(matched);
            setDiagnosis(matched.symptoms ? `Assessment for: ${matched.symptoms}` : '');
          }

          // Check if summary already exists for this appointment
          const existing = await visitSummaryService.getAppointmentSummary(targetId);
          if (existing) {
            setDiagnosis(existing.diagnosis || '');
            setClinicalNotes(existing.summary || '');
            setMedications(existing.prescribed_medications || '');
            setFollowUpDate(existing.follow_up_date || '');
          }
        }
      } catch (err) {
        console.error('Error loading summary editor data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id, paramAppointmentId]);

  // When changing selected appointment dropdown
  const handleSelectAppointment = async (apptId) => {
    setSelectedAppointmentId(apptId);
    const matched = doctorAppointments.find(a => a.id === apptId);
    setCurrentAppointment(matched || null);

    try {
      const existing = await visitSummaryService.getAppointmentSummary(apptId);
      if (existing) {
        setDiagnosis(existing.diagnosis || '');
        setClinicalNotes(existing.summary || '');
        setMedications(existing.prescribed_medications || '');
        setFollowUpDate(existing.follow_up_date || '');
        setFeedback({ type: 'success', text: 'Loaded existing record for this consultation.' });
      } else {
        setDiagnosis(matched?.symptoms ? `Clinical assessment: ${matched.symptoms}` : '');
        setClinicalNotes('');
        setMedications('');
        setFollowUpDate('');
        setFeedback(null);
      }
    } catch (e) {
      console.warn('Summary lookup notice:', e.message);
    }
  };

  const handleSave = async (isPublished = false) => {
    if (!diagnosis.trim() || !clinicalNotes.trim()) {
      alert('Clinical Diagnosis and Observations are required.');
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await visitSummaryService.saveSummary({
        appointmentId: selectedAppointmentId || 'appt-demo-1',
        doctorId: user?.id,
        patientId: currentAppointment?.patientId || paramPatientId,
        summary: clinicalNotes,
        diagnosis,
        medications,
        followUpDate: followUpDate || null,
        isPublished
      });

      setFeedback({
        type: 'success',
        text: isPublished
          ? 'Consultation summary successfully published to the patient encrypted vault.'
          : 'Consultation summary draft saved privately.'
      });

      // Refresh summaries
      const updatedSummaries = await visitSummaryService.getDoctorSummaries(user.id);
      setPastSummaries(updatedSummaries);
    } catch (err) {
      console.error('Save summary error:', err);
      setFeedback({ type: 'error', text: err.message || 'Unable to save visit summary.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      
      {/* Back Navigation */}
      <button 
        onClick={() => navigate('/doctor/dashboard')}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5 backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Clinical Documentation & Prescription Engine</span>
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">Visit Summary & Prescription Editor</h1>
        <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
          Record diagnosis findings, save private consultation drafts, and publish verified electronic prescriptions directly to the patient's encrypted medical vault.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Form: 2 Cols */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
          
          {/* Consultation Target Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Patient Consultation
            </label>
            <select
              value={selectedAppointmentId}
              onChange={(e) => handleSelectAppointment(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {doctorAppointments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.patientName} — {apt.date} at {apt.time} ({apt.status})
                </option>
              ))}
            </select>
          </div>

          {/* Current Appointment Metadata Card */}
          {currentAppointment && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Patient</span>
                <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{currentAppointment.patientName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Date & Time</span>
                <span className="font-semibold text-slate-700 block mt-0.5">{currentAppointment.date} ({currentAppointment.time})</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                <span className="font-bold text-teal-700 block mt-0.5">{currentAppointment.status}</span>
              </div>
            </div>
          )}

          {/* Clinical Diagnosis (Section 10) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Clinical Diagnosis <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input 
                type="text"
                required
                placeholder="e.g. Mild Hypertension, Essential Tremor, Type 2 Diabetes..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Clinical Findings & Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Doctor's Clinical Observations & Findings <span className="text-red-500">*</span>
            </label>
            <textarea 
              rows={4}
              required
              placeholder="Record physical examination findings, lab result interpretations, and clinical recommendations..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full p-3.5 border border-slate-300 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />
          </div>

          {/* Prescriptions & Medications */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Pill className="w-3.5 h-3.5 text-teal-600" />
              <span>Prescribed Medications & Dosage Regimen</span>
            </label>
            <textarea 
              rows={3}
              placeholder="e.g.&#10;Atorvastatin 20mg - 1 tablet daily at night&#10;Aspirin 75mg - 1 tablet daily post lunch"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              className="w-full p-3.5 border border-slate-300 rounded-xl text-xs md:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
            />
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Recommended Follow-Up Review Date
            </label>
            <input 
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 border border-slate-300 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Action Buttons: Save Draft vs Publish (Section 10) */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button 
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition text-xs flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>{saving ? 'Saving...' : 'Save Draft (Private)'}</span>
            </button>

            <button 
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-7 py-3 rounded-xl shadow transition text-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing to Patient Vault...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Summary to Patient Vault</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Past Summaries & Clinical Records List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Recent Clinical Summaries</span>
            </h3>
            <span className="text-[10px] font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
              {pastSummaries.length} Records
            </span>
          </div>

          {pastSummaries.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No previous visit summaries recorded.</p>
          ) : (
            <div className="space-y-3">
              {pastSummaries.map((s) => (
                <div 
                  key={s.id} 
                  className={`border rounded-2xl p-3.5 space-y-1.5 transition ${
                    s.isPublished ? 'bg-slate-50/70 border-slate-100' : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 text-xs">{s.patientName}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      s.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-teal-800 font-semibold line-clamp-1">{s.diagnosis}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{s.summary}</p>
                  <div className="pt-1 text-[10px] text-slate-400 flex justify-between items-center">
                    <span>{s.date}</span>
                    <button
                      onClick={() => {
                        setDiagnosis(s.diagnosis || '');
                        setClinicalNotes(s.summary || '');
                        setMedications(s.medications || '');
                        setFollowUpDate(s.followUpDate || '');
                        if (s.appointmentId) setSelectedAppointmentId(s.appointmentId);
                      }}
                      className="text-teal-600 hover:text-teal-800 font-bold flex items-center space-x-0.5"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Load into Editor</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}