import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Calendar, Clock, User, FileText, CheckCircle2, XCircle, Search, 
  Stethoscope, ShieldCheck, Download, Loader2, AlertCircle, ChevronRight,
  Filter, X, PlusCircle, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';

export default function DoctorAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get('status') || 'All');
  const [filterDate, setFilterDate] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected appointment for detail modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Consequential action modal state: { type: 'REJECT' | 'CANCEL', appointmentId, patientName }
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null); // { type: 'success' | 'error', text }

  const loadAppointments = async () => {
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
  };

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  // Handle direct Confirm
  const handleConfirm = async (id) => {
    setProcessingAction(true);
    try {
      await appointmentService.confirmAppointment(id);
      setFeedbackMsg({ type: 'success', text: 'Appointment successfully confirmed.' });
      await loadAppointments();
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(prev => prev ? { ...prev, status: 'CONFIRMED' } : null);
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Could not confirm appointment: ${err.message}` });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle direct Mark Complete
  const handleComplete = async (id) => {
    setProcessingAction(true);
    try {
      await appointmentService.completeAppointment(id);
      setFeedbackMsg({ type: 'success', text: 'Consultation marked completed. You can now draft a visit summary.' });
      await loadAppointments();
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Could not complete appointment: ${err.message}` });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Modal submission for Reject / Cancel
  const handleModalActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal) return;
    if (!actionReason.trim()) {
      alert('Please provide a reason.');
      return;
    }

    setProcessingAction(true);
    try {
      if (actionModal.type === 'REJECT') {
        await appointmentService.rejectAppointment(actionModal.appointmentId, actionReason);
        setFeedbackMsg({ type: 'success', text: 'Appointment request has been declined and the slot was released.' });
      } else {
        await appointmentService.cancelAppointment(actionModal.appointmentId, actionReason);
        setFeedbackMsg({ type: 'success', text: 'Appointment has been cancelled.' });
      }
      setActionModal(null);
      setActionReason('');
      await loadAppointments();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: `Operation failed: ${err.message}` });
    } finally {
      setProcessingAction(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(s) ||
      (apt.symptoms && apt.symptoms.toLowerCase().includes(s)) ||
      (apt.patientPhone && apt.patientPhone.toLowerCase().includes(s));

    const statusUpper = apt.status?.toUpperCase() || '';
    let matchesStatus = true;
    if (filterStatus === 'Today') {
      matchesStatus = apt.date === todayStr;
    } else if (filterStatus === 'Upcoming') {
      matchesStatus = (statusUpper === 'CONFIRMED' || statusUpper === 'PENDING') && apt.date >= todayStr;
    } else if (filterStatus === 'Pending') {
      matchesStatus = statusUpper === 'PENDING';
    } else if (filterStatus === 'Completed') {
      matchesStatus = statusUpper === 'COMPLETED';
    } else if (filterStatus === 'Cancelled') {
      matchesStatus = statusUpper === 'CANCELLED' || statusUpper === 'REJECTED';
    }

    const matchesDate = !filterDate || apt.date === filterDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Consultation Schedule & Triage</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">Physician Appointment Management</h1>
          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl">
            Inspect incoming patient booking requests, confirm clinical consultations, and manage ongoing medical schedules backed by PostgreSQL.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <p className="text-2xl font-black">{appointments.length}</p>
          <p className="text-[10px] text-teal-200 uppercase tracking-wider font-bold">Total Assigned</p>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold transition ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search, Date Filter, and Status Tabs Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text"
              placeholder="Search by patient name, phone, or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Date:</label>
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className="text-xs text-slate-400 hover:text-slate-600 p-1.5"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs (Section 6) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {['All', 'Today', 'Upcoming', 'Pending', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filterStatus === status 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">
            Consultation Roster ({filteredAppointments.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">PostgreSQL Live Data</span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading appointments from Supabase...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No Consultations Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No appointments matched your selected filter criteria. Try adjusting the search or status tabs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => {
              const statusUpper = apt.status?.toUpperCase() || '';

              return (
                <div 
                  key={apt.id} 
                  className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-5 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-11 h-11 bg-teal-100 text-teal-800 rounded-xl flex items-center justify-center font-bold text-base shadow-sm">
                        {apt.patientName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm md:text-base">{apt.patientName}</span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            statusUpper === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                            statusUpper === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            statusUpper === 'COMPLETED' ? 'bg-sky-100 text-sky-800' :
                            statusUpper === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Phone: {apt.patientPhone || 'Not listed'} • ID: #{String(apt.id).slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-100">
                      <span className="flex items-center space-x-1 font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{apt.date}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>{apt.time} - {apt.endTimeStr || '30 mins'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Consultation Reason & Symptoms */}
                  <div className="text-xs bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                    <p className="text-slate-700">
                      <strong className="text-slate-900">Reason for Visit: </strong> 
                      {apt.symptoms || apt.consultationReason || 'Routine general checkup and physical examination.'}
                    </p>
                    {apt.cancellationReason && (
                      <p className="text-red-600 pt-1 border-t border-slate-100 font-medium">
                        <strong>Reason Recorded:</strong> {apt.cancellationReason}
                      </p>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                    
                    {/* Left: View Details / Patient Record */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedAppointment(apt)}
                        className="text-teal-700 hover:text-teal-900 font-bold hover:underline"
                      >
                        Inspect Details
                      </button>
                      {apt.patientId && (
                        <>
                          <span className="text-slate-300">•</span>
                          <button
                            onClick={() => navigate(`/doctor/patient-record/${apt.patientId}`)}
                            className="text-sky-700 hover:text-sky-900 font-bold hover:underline"
                          >
                            Open Patient Vault
                          </button>
                        </>
                      )}
                    </div>

                    {/* Right: State Transition Actions (Section 6) */}
                    <div className="flex flex-wrap items-center gap-2">
                      {statusUpper === 'PENDING' && (
                        <>
                          <button
                            disabled={processingAction}
                            onClick={() => handleConfirm(apt.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition disabled:opacity-50 flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>
                          <button
                            disabled={processingAction}
                            onClick={() => {
                              setActionModal({ type: 'REJECT', appointmentId: apt.id, patientName: apt.patientName });
                              setActionReason('');
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-1.5 rounded-xl font-bold transition disabled:opacity-50"
                          >
                            Decline Request
                          </button>
                        </>
                      )}

                      {statusUpper === 'CONFIRMED' && (
                        <>
                          <button
                            disabled={processingAction}
                            onClick={() => handleComplete(apt.id)}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition disabled:opacity-50 flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                          <button
                            onClick={() => navigate(`/doctor/visit-summary?appointmentId=${apt.id}`)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-800 px-3.5 py-1.5 rounded-xl font-bold transition flex items-center space-x-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Write Summary</span>
                          </button>
                          <button
                            disabled={processingAction}
                            onClick={() => {
                              setActionModal({ type: 'CANCEL', appointmentId: apt.id, patientName: apt.patientName });
                              setActionReason('');
                            }}
                            className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 px-3 py-1.5 rounded-xl font-semibold transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {statusUpper === 'COMPLETED' && (
                        <button
                          onClick={() => navigate(`/doctor/visit-summary?appointmentId=${apt.id}`)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-800 px-3.5 py-1.5 rounded-xl font-bold transition flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View / Edit Visit Summary</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span>Consultation Details</span>
              </h3>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Patient Name</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Contact</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{selectedAppointment.patientPhone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Date & Time</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{selectedAppointment.date} at {selectedAppointment.time}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Status</span>
                  <p className="font-extrabold text-teal-700 text-xs mt-0.5">{selectedAppointment.status}</p>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Reported Clinical Symptoms / Purpose</label>
                <p className="bg-white border border-slate-200 p-3 rounded-xl text-slate-800 leading-relaxed">
                  {selectedAppointment.symptoms || selectedAppointment.consultationReason}
                </p>
              </div>

              {selectedAppointment.cancellationReason && (
                <div>
                  <label className="font-bold text-red-500 uppercase text-[10px] block mb-1">Reason for Decline / Cancellation</label>
                  <p className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-800">
                    {selectedAppointment.cancellationReason}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              {selectedAppointment.patientId && (
                <button
                  onClick={() => {
                    const id = selectedAppointment.patientId;
                    setSelectedAppointment(null);
                    navigate(`/doctor/patient-record/${id}`);
                  }}
                  className="bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold px-4 py-2 rounded-xl text-xs transition"
                >
                  View Full Medical Record
                </button>
              )}
              <button
                onClick={() => setSelectedAppointment(null)}
                className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Reason Confirmation Modal (Section 6: Consequential action confirmation) */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleModalActionSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>
                  {actionModal.type === 'REJECT' ? 'Decline Consultation Request' : 'Cancel Appointment'}
                </span>
              </h3>
              <button 
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to {actionModal.type === 'REJECT' ? 'decline' : 'cancel'} the appointment for <strong>{actionModal.patientName}</strong>? Please provide a clinical or scheduling reason.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason (Required)
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Emergency surgery scheduled, outside physician clinical scope, or rescheduled upon patient phone request..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={processingAction}
                onClick={() => setActionModal(null)}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processingAction}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center space-x-1.5"
              >
                {processingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm {actionModal.type === 'REJECT' ? 'Decline' : 'Cancellation'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}