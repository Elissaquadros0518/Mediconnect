
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Stethoscope,
  User,
  Loader2,
  FileText,
  RefreshCw
} from 'lucide-react';

import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

export default function AppointmentsManagement() {
  const { user } = useAuth();

  const role = user?.role?.toLowerCase();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';
  const isPatient = role === 'patient';

  const filters = isAdmin
    ? ['ALL', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']
    : isDoctor
      ? ['ALL', 'APPROVED', 'COMPLETED', 'CANCELLED']
      : ['ALL', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'];

  const loadAppointments = useCallback(async () => {
    if (!user?.id || !role) return;

    setLoading(true);
    setErrorMessage('');

    try {
      let data = [];

      if (isAdmin) {
        data = await appointmentService.getAdminAppointments({
          search: searchTerm,
          status: statusFilter
        });
      } else if (isDoctor) {
        const doctorProfileId = user.doctorProfile?.id;

        if (!doctorProfileId) {
          throw new Error('Your doctor profile could not be found.');
        }

        data = await appointmentService.getDoctorAppointments({
          doctorId: doctorProfileId,
          search: searchTerm,
          status: statusFilter
        });
      } else if (isPatient) {
        data = await appointmentService.getPatientAppointments(user.id);

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();

          data = data.filter(apt =>
            (apt.doctor || '').toLowerCase().includes(term) ||
            (apt.reason || '').toLowerCase().includes(term)
          );
        }

        if (statusFilter !== 'ALL') {
          data = data.filter(
            apt => apt.status?.toUpperCase() === statusFilter
          );
        }
      } else {
        throw new Error('Your account role is not recognized.');
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setErrorMessage(error.message || 'Could not load appointments.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user, role, isAdmin, isDoctor, isPatient, searchTerm, statusFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleAppointmentAction = async (appointmentId, action) => {
    const actionLabels = {
      approve: 'approve',
      reject: 'reject',
      complete: 'complete',
      cancel: 'cancel'
    };

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabels[action]} this appointment?`
    );

    if (!confirmed) return;

    setActionLoading(appointmentId);
    setActionSuccess('');
    setErrorMessage('');

    try {
      let result;

      if (action === 'approve') {
        result = await appointmentService.approveAppointment(appointmentId);
      } else if (action === 'reject') {
        result = await appointmentService.rejectAppointment(appointmentId);
      } else if (action === 'complete') {
        result = await appointmentService.updateAppointmentStatus(
          appointmentId,
          'COMPLETED'
        );
      } else if (action === 'cancel') {
        result = await appointmentService.updateAppointmentStatus(
          appointmentId,
          'CANCELLED'
        );
      }

      setActionSuccess(
        `Appointment successfully ${actionLabels[action]}${action === 'approve' ? 'd' : action === 'reject' ? 'ed' : action === 'complete' ? 'd' : 'led'}.`
      );

      await loadAppointments();
    } catch (error) {
      console.error('Appointment action failed:', error);
      setErrorMessage(error.message || 'Could not update appointment.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusStyle = status => {
    switch ((status || '').toUpperCase()) {
      case 'PENDING_ADMIN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatStatus = status => {
    const labels = {
      PENDING_ADMIN: 'Pending Approval',
      APPROVED: 'Approved',
      COMPLETED: 'Completed',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled'
    };

    return labels[(status || '').toUpperCase()] || status || 'Unknown';
  };

  const pageTitle = isAdmin
    ? 'Appointment Requests'
    : isDoctor
      ? 'Patient Appointments Schedule'
      : 'My Appointments';

  const pageDescription = isAdmin
    ? 'Review patient appointment requests and approve or reject bookings.'
    : isDoctor
      ? 'View approved patient consultations and manage their statuses.'
      : 'Track your appointment bookings and approval status.';

  const formatDate = date => {
    if (!date) return 'Date unavailable';

    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="bg-white/10 text-teal-200 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-2">
              <Stethoscope className="w-3.5 h-3.5" />
              {role} Portal
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {pageTitle}
            </h1>

            <p className="text-teal-200/90 text-xs md:text-sm max-w-2xl">
              {pageDescription}
            </p>
          </div>

          <div className="bg-white/10 border border-white/15 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>

            <div>
              <p className="text-[10px] text-teal-200 uppercase font-bold">
                {isAdmin ? 'Total Requests' : 'Appointments'}
              </p>
              <p className="text-xl font-black">
                {appointments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionSuccess}
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
            />
          </div>

          <button
            onClick={loadAppointments}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filters.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All' : formatStatus(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment List */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            {isAdmin
              ? 'Appointment Review Queue'
              : isDoctor
                ? 'Patient Consultation Queue'
                : 'Your Bookings'}
          </h3>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-400">
              Loading appointments...
            </p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />

            <p className="text-sm font-bold text-slate-700">
              No appointments found
            </p>

            <p className="text-xs text-slate-400">
              {isAdmin
                ? 'New patient booking requests will appear here.'
                : isDoctor
                  ? 'Approved appointments assigned to you will appear here.'
                  : 'Your bookings will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map(apt => {
              const status = (apt.status || '').toUpperCase();
              const pending = status === 'PENDING_ADMIN';
              const approved = status === 'APPROVED';

              return (
                <div
                  key={apt.id}
                  className="p-4 md:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-slate-50/70 transition"
                >
                  {/* Appointment Details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm md:text-base">
                        {isPatient
                          ? apt.doctor || 'Assigned Physician'
                          : apt.patientName || 'Patient Consultation'}
                      </span>

                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                        {apt.consultationType || 'In-Person'}
                      </span>
                    </div>

                    {isAdmin && (
                      <p className="text-xs text-slate-600">
                        Doctor: <strong>{apt.doctorName || 'Assigned Physician'}</strong>
                      </p>
                    )}

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {formatDate(apt.date || apt.appointmentDate)}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {apt.time || apt.appointmentTime || 'Time unavailable'}
                      </span>
                    </div>

                    {apt.reason && (
                      <p className="text-xs text-slate-600">
                        <strong>Reason:</strong> {apt.reason}
                      </p>
                    )}
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border ${getStatusStyle(status)}`}>
                      {formatStatus(status)}
                    </span>

                    {/* ADMIN ACTIONS */}
                    {isAdmin && pending && (
                      <>
                        <button
                          onClick={() => handleAppointmentAction(apt.id, 'approve')}
                          disabled={actionLoading === apt.id}
                          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {actionLoading === apt.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Accept
                        </button>

                        <button
                          onClick={() => handleAppointmentAction(apt.id, 'reject')}
                          disabled={actionLoading === apt.id}
                          className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}

                    {/* DOCTOR ACTIONS */}
                    {isDoctor && approved && (
                      <>
                        <button
                          onClick={() => handleAppointmentAction(apt.id, 'complete')}
                          disabled={actionLoading === apt.id}
                          className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Complete
                        </button>

                        <button
                          onClick={() => handleAppointmentAction(apt.id, 'cancel')}
                          disabled={actionLoading === apt.id}
                          className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl font-bold disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
