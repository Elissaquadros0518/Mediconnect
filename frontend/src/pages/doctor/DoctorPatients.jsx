
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Users, Search, Calendar, Phone, ShieldCheck, ChevronRight,
  ChevronDown, ChevronUp, Loader2, FileText, CheckCircle2,
  AlertCircle, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';

export default function DoctorPatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const doctorProfileId = user?.doctorProfile?.id;

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(
    () => searchParams.get('status') || 'All'
  );
  const [filterDate, setFilterDate] = useState('');

  // Data state
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPatientId, setExpandedPatientId] = useState(null);

  // Action modal state
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Load appointments belonging to the logged-in doctor
  const loadDoctorData = useCallback(async () => {
    if (!doctorProfileId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await appointmentService.getDoctorAppointments({
        doctorId: doctorProfileId
      });

      setAppointments(data || []);
    } catch (err) {
      console.error('Error loading doctor appointments:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Could not load appointments.'
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [doctorProfileId]);

  useEffect(() => {
    loadDoctorData();
  }, [loadDoctorData]);

  // Confirm appointment
  const handleConfirm = async (appointmentId) => {
    setProcessingAction(true);

    try {
      await appointmentService.approveAppointment(appointmentId);

      setFeedbackMsg({
        type: 'success',
        text: 'Appointment approved successfully.'
      });

      await loadDoctorData();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: `Could not approve appointment: ${err.message}`
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Mark appointment as completed
  const handleComplete = async (appointmentId) => {
    setProcessingAction(true);

    try {
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        'COMPLETED'
      );

      setFeedbackMsg({
        type: 'success',
        text: 'Consultation marked as completed.'
      });

      await loadDoctorData();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: `Could not complete appointment: ${err.message}`
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Reject or cancel appointment
  const handleModalActionSubmit = async (e) => {
    e.preventDefault();

    if (!actionModal || !actionReason.trim()) {
      return;
    }

    setProcessingAction(true);

    try {
      if (actionModal.type === 'REJECT') {
        await appointmentService.rejectAppointment(
          actionModal.appointmentId
        );

        setFeedbackMsg({
          type: 'success',
          text: 'Appointment request rejected.'
        });
      } else {
        await appointmentService.updateAppointmentStatus(
          actionModal.appointmentId,
          'CANCELLED'
        );

        setFeedbackMsg({
          type: 'success',
          text: 'Appointment cancelled successfully.'
        });
      }

      setActionModal(null);
      setActionReason('');
      await loadDoctorData();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: `Operation failed: ${err.message}`
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-CA');

  // Group appointments by patient
  const patientMap = new Map();

  for (const apt of appointments) {
    const pId = apt.patientId;

    if (!pId) continue;

    const status = apt.status?.toUpperCase();

    if (!patientMap.has(pId)) {
      patientMap.set(pId, {
        id: pId,
        name: apt.patientName || 'Patient',
        phone: apt.patientPhone || 'Not provided',
        avatar: apt.patientAvatar,
        appointments: [],
        lastConsultation: 'N/A',
        nextAppointment: 'None Scheduled',
        latestReason: 'General Consultation',
        latestStatus: status
      });
    }

    const patient = patientMap.get(pId);
    patient.appointments.push(apt);

    if (
      status === 'COMPLETED' &&
      (patient.lastConsultation === 'N/A' ||
        apt.date > patient.lastConsultation)
    ) {
      patient.lastConsultation = apt.date;
    }

    if (
      status === 'APPROVED' &&
      apt.date >= todayStr
    ) {
      const appointmentDateTime = `${apt.date} ${apt.time}`;

      if (
        patient.nextAppointment === 'None Scheduled' ||
        appointmentDateTime < patient.nextAppointment
      ) {
        patient.nextAppointment = appointmentDateTime;
      }
    }

    if (
      !patient.latestReason ||
      patient.latestReason === 'General Consultation'
    ) {
      patient.latestReason =
        apt.consultationReason ||
        apt.reason ||
        apt.symptoms ||
        'General Consultation';
    }
  }

  const allPatients = Array.from(patientMap.values());

  // Search, date and status filtering
  const filteredPatients = allPatients.filter((patient) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      !search ||
      patient.name.toLowerCase().includes(search) ||
      patient.phone.toLowerCase().includes(search) ||
      patient.id.toLowerCase().includes(search) ||
      patient.appointments.some((apt) =>
        (
          apt.consultationReason ||
          apt.reason ||
          apt.symptoms ||
          ''
        ).toLowerCase().includes(search)
      );

    const matchesDate =
      !filterDate ||
      patient.appointments.some((apt) => apt.date === filterDate);

    let matchesStatus = true;

    if (filterStatus === 'Today') {
      matchesStatus = patient.appointments.some(
        (apt) => apt.date === todayStr
      );
    } else if (filterStatus === 'Upcoming') {
      matchesStatus = patient.appointments.some(
        (apt) => apt.status === 'APPROVED' && apt.date >= todayStr
      );
    } else if (filterStatus === 'Pending') {
      matchesStatus = patient.appointments.some(
        (apt) => apt.status === 'PENDING_ADMIN'
      );
    } else if (filterStatus === 'Confirmed') {
      matchesStatus = patient.appointments.some(
        (apt) => apt.status === 'APPROVED'
      );
    } else if (filterStatus === 'Completed') {
      matchesStatus = patient.appointments.some(
        (apt) => apt.status === 'COMPLETED'
      );
    } else if (filterStatus === 'Cancelled') {
      matchesStatus = patient.appointments.some(
        (apt) =>
          apt.status === 'CANCELLED' ||
          apt.status === 'REJECTED'
      );
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Clinical Patient Directory</span>
          </span>

          <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">
            PATIENT DIRECTORY
          </h1>

          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl">
            View your registered patients and manage their consultations.
          </p>
        </div>

        <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <p className="text-2xl font-black">{allPatients.length}</p>
          <p className="text-[10px] text-teal-200 uppercase tracking-wider font-bold">
            Authorized Patients
          </p>
        </div>
      </div>

      {/* Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>

          <button onClick={() => setFeedbackMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">

          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              placeholder="Search by patient name, phone, ID, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-500 whitespace-nowrap">
              Filter Date:
            </label>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
            />

            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-slate-400 p-1.5"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          {[
            'All',
            'Today',
            'Upcoming',
            'Pending',
            'Confirmed',
            'Completed',
            'Cancelled'
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                filterStatus === tab
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Patient directory */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">

        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Authorized Patient Roster ({filteredPatients.length})</span>
          </h3>

          <span className="text-xs text-slate-400 font-medium">
            PostgreSQL RLS Protected
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">
              Loading authorized patients...
            </p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />

            <h4 className="font-bold text-slate-700 text-sm">
              No Patients Found
            </h4>

            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || filterDate || filterStatus !== 'All'
                ? 'No patients match the selected filters.'
                : 'Patients will appear here once they book appointments with you.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => {
              const isExpanded = expandedPatientId === patient.id;

              const completedCount = patient.appointments.filter(
                (apt) => apt.status === 'COMPLETED'
              ).length;

              return (
                <div
                  key={patient.id}
                  className="border border-slate-200 rounded-2xl p-5 hover:border-teal-300 transition bg-slate-50/30 space-y-4"
                >

                  {/* Patient header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center font-black text-lg">
                        {patient.name.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {patient.name}
                          </h4>

                          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-md">
                            ID: {patient.id.slice(0, 8)}...
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{patient.phone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <span className="text-[11px] bg-teal-50 text-teal-800 font-extrabold px-3 py-1 rounded-full border border-teal-100">
                        {patient.appointments.length} Consultations ({completedCount} Completed)
                      </span>

                      <button
                        onClick={() =>
                          navigate(`/doctor/patient-record/${patient.id}`)
                        }
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1"
                      >
                        <span>Open Vault</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Patient summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Last Completed
                      </span>
                      <span className="font-semibold text-slate-700">
                        {patient.lastConsultation}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Upcoming Schedule
                      </span>
                      <span className="font-semibold text-teal-700">
                        {patient.nextAppointment}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Latest Reason
                      </span>
                      <span className="font-semibold text-slate-700 truncate block">
                        {patient.latestReason}
                      </span>
                    </div>
                  </div>

                  {/* Expand consultations */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() =>
                        setExpandedPatientId(
                          isExpanded ? null : patient.id
                        )
                      }
                      className="text-xs font-bold text-teal-700 flex items-center space-x-1.5"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}

                      <span>
                        {isExpanded
                          ? 'Hide Consultations'
                          : `Manage Consultations (${patient.appointments.length})`}
                      </span>
                    </button>
                  </div>

                  {/* Consultation history */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Consultation History & Actions
                      </p>

                      <div className="space-y-2.5">
                        {patient.appointments.map((appt) => {
                          const status = appt.status?.toUpperCase();

                          const isPending = status === 'PENDING_ADMIN';
                          const isApproved = status === 'APPROVED';
                          const isCompleted = status === 'COMPLETED';
                          const isCancelled =
                            status === 'CANCELLED' ||
                            status === 'REJECTED';

                          return (
                            <div
                              key={appt.id}
                              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                      isApproved
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : isPending
                                        ? 'bg-amber-100 text-amber-800'
                                        : isCompleted
                                        ? 'bg-sky-100 text-sky-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {status}
                                  </span>

                                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>
                                      {appt.date} at {appt.time}
                                    </span>
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600">
                                  <strong>Reason: </strong>
                                  {appt.consultationReason ||
                                    appt.reason ||
                                    appt.symptoms ||
                                    'General Consultation'}
                                </p>
                              </div>

                              {/* Appointment actions */}
                              <div className="flex items-center space-x-2 shrink-0">

                                {isPending && (
                                  <>
                                    <button
                                      disabled={processingAction}
                                      onClick={() => handleConfirm(appt.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
                                    >
                                      Approve
                                    </button>

                                    <button
                                      disabled={processingAction}
                                      onClick={() => {
                                        setActionModal({
                                          type: 'REJECT',
                                          appointmentId: appt.id,
                                          patientName: patient.name
                                        });
                                        setActionReason('');
                                      }}
                                      className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {isApproved && (
                                  <>
                                    <button
                                      disabled={processingAction}
                                      onClick={() => handleComplete(appt.id)}
                                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
                                    >
                                      Mark Completed
                                    </button>

                                    <button
                                      disabled={processingAction}
                                      onClick={() => {
                                        setActionModal({
                                          type: 'CANCEL',
                                          appointmentId: appt.id,
                                          patientName: patient.name
                                        });
                                        setActionReason('');
                                      }}
                                      className="border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}

                                {isCompleted && (
                                  <Link
                                    to={`/doctor/visit-summary?appointmentId=${appt.id}`}
                                    className="bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Write Visit Summary</span>
                                  </Link>
                                )}

                                {isCancelled && (
                                  <span className="text-xs text-slate-400 font-semibold">
                                    No actions available
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject / Cancel modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">

            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base">
                {actionModal.type === 'REJECT'
                  ? 'Decline Appointment Request'
                  : 'Cancel Confirmed Appointment'}
              </h4>

              <button
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter the reason for this action for{' '}
              <strong>{actionModal.patientName}</strong>.
            </p>

            <form
              onSubmit={handleModalActionSubmit}
              className="space-y-4"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Reason *
                </label>

                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Dismiss
                </button>

                <button
                  type="submit"
                  disabled={processingAction || !actionReason.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 ${
                    actionModal.type === 'REJECT'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {processingAction
                    ? 'Processing...'
                    : actionModal.type === 'REJECT'
                    ? 'Decline Appointment'
                    : 'Cancel Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
