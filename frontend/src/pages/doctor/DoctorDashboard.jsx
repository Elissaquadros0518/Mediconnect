import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  Calendar, Clock, Users, CheckCircle2, AlertCircle,
  Stethoscope, ChevronRight, ArrowUpRight, Plus,
  FileText, Bell, Loader2, Activity, UserCheck,
  PieChart as PieIcon, Printer
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { notificationService } from '../../services/notificationService';

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const EMPTY_METRICS = {
  todayCount: 0,
  pendingCount: 0,
  upcomingCount: 0,
  completedCount: 0,
  availableSlotsCount: 0,
  totalPatientsSeen: 0,
  todayAppointments: [],
  pendingRequests: [],
  upcomingAppointments: [],
  statusDistribution: []
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const doctorProfileId = user?.doctorProfile?.id;

  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState('today');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const doctorProfile = user?.doctorProfile;

  const loadDashboardData = useCallback(async () => {
    if (!doctorProfileId || !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const todayStr = getLocalDateString(new Date());

      const [
        appointments,
        slots,
        userNotifications
      ] = await Promise.all([
        appointmentService.getDoctorAppointments({
          doctorId: doctorProfileId
        }),

        doctorService.getDoctorSlots(
          doctorProfileId,
          todayStr
        ),

        notificationService.getUserNotifications(
          user.id,
          'doctor'
        )
      ]);

      const allAppointments = appointments || [];

      // Only approved appointments are included in the doctor's schedule.
      const approvedAppointments = allAppointments.filter(
        apt => apt.status === 'APPROVED'
      );

      const todayAppointments = approvedAppointments.filter(
        apt => apt.date === todayStr
      );

      const upcomingAppointments = approvedAppointments.filter(
        apt => apt.date > todayStr
      );

      const completedAppointments = allAppointments.filter(
        apt => apt.status === 'COMPLETED'
      );

      const availableSlots = (slots || []).filter(
        slot => slot.status?.toLowerCase() === 'available'
      );

      const uniquePatients = new Set(
        allAppointments
          .map(apt => apt.patientId)
          .filter(Boolean)
      );

      const statusColors = {
        APPROVED: '#0d9488',
        COMPLETED: '#0284c7',
        CANCELLED: '#ef4444'
      };

      const statusDistribution = Object.keys(statusColors).map(status => ({
        name: status,
        count: allAppointments.filter(
          apt => apt.status === status
        ).length,
        color: statusColors[status]
      }));

      setMetrics({
        todayCount: todayAppointments.length,

        // Pending requests are handled by hospital administration.
        pendingCount: 0,

        upcomingCount: upcomingAppointments.length,
        completedCount: completedAppointments.length,
        availableSlotsCount: availableSlots.length,
        totalPatientsSeen: uniquePatients.size,

        todayAppointments,
        pendingRequests: [],
        upcomingAppointments,
        statusDistribution
      });

      setNotifications((userNotifications || []).slice(0, 3));

    } catch (err) {
      console.error('Error loading doctor dashboard:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });

      setErrorMsg(
        err.message || 'Unable to load dashboard information.'
      );
    } finally {
      setLoading(false);
    }
  }, [doctorProfileId, user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Complete an approved appointment.
  const handleQuickComplete = async (appointmentId) => {
    setActionLoadingId(appointmentId);

    try {
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        'COMPLETED'
      );

      await loadDashboardData();

    } catch (err) {
      console.error('Complete appointment error:', err);
      alert(`Could not complete appointment: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const currentList =
    activeTab === 'today'
      ? metrics.todayAppointments
      : metrics.upcomingAppointments;

  const doctorName = user?.name || 'Doctor';

  const specialty =
    doctorProfile?.specialty || 'General';

  const qualification =
    doctorProfile?.qualification || 'Not provided';

  const registrationNumber =
    doctorProfile?.registration_number || 'Not provided';

  const verificationStatus =
    doctorProfile?.verification_status;

  if (!user) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-sm text-slate-500 mt-3">
          Loading your account...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

          <div className="flex items-start sm:items-center space-x-4">

            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-500 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-teal-950 rounded-[14px] flex items-center justify-center text-teal-100 font-extrabold text-2xl">
                  {doctorName
                    .replace(/^Dr\.?\s*/i, '')
                    .split(' ')
                    .map(part => part[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
              </div>

              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                verificationStatus === 'APPROVED'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-400 text-slate-950'
              }`}>
                {verificationStatus === 'APPROVED'
                  ? <CheckCircle2 className="w-3.5 h-3.5" />
                  : <Clock className="w-3.5 h-3.5" />
                }
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <span className="bg-white/10 text-teal-200 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1">
                <Stethoscope className="w-3 h-3" />
                <span>Physician Portal</span>
              </span>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome back, {doctorName}
              </h1>

              <p className="text-teal-200/90 text-xs sm:text-sm">
                <strong className="text-white">
                  {specialty}
                </strong>
                {' Specialist • '}
                {qualification}
                {' • Registration: '}
                {registrationNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
            <Link
              to="/doctor/manage-slots"
              className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-3 rounded-xl border border-white/20 flex items-center justify-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Manage Slots</span>
            </Link>

            <Link
              to="/doctor/visit-summary"
              className="flex-1 sm:flex-none bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Visit Summary</span>
            </Link>

            <Link
              to="/doctor/profile"
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 flex items-center justify-center"
              title="Profile settings"
            >
              <UserCheck className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Verification notice */}
      {verificationStatus === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

            <div>
              <p className="font-bold text-sm">
                Credentials verification pending
              </p>

              <p className="text-xs mt-1">
                Your credentials are awaiting hospital administration
                approval. Public doctor listings and patient bookings
                become available after approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm flex justify-between items-center">
          <span>{errorMsg}</span>

          <button
            onClick={loadDashboardData}
            className="font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Clinical Practice Metrics</span>
          </h2>

          <button
            onClick={loadDashboardData}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

          {[
            {
              label: "Today's Appointments",
              value: metrics.todayCount,
              color: 'teal',
              icon: Calendar,
              action: () => setActiveTab('today')
            },
            {
              label: 'Pending Admin Review',
              value: metrics.pendingCount,
              color: 'amber',
              icon: AlertCircle,
              action: () => navigate('/doctor/appointments')
            },
            {
              label: 'Upcoming',
              value: metrics.upcomingCount,
              color: 'sky',
              icon: Clock,
              action: () => setActiveTab('upcoming')
            },
            {
              label: 'Completed',
              value: metrics.completedCount,
              color: 'emerald',
              icon: CheckCircle2,
              action: () => navigate('/doctor/appointments?status=COMPLETED')
            },
            {
              label: "Today's Open Slots",
              value: metrics.availableSlotsCount,
              color: 'teal',
              icon: Clock,
              action: () => navigate('/doctor/manage-slots')
            },
            {
              label: 'Patients',
              value: metrics.totalPatientsSeen,
              color: 'indigo',
              icon: Users,
              action: () => navigate('/doctor/patients')
            }
          ].map(item => {
            const Icon = item.icon;

            const colorClasses = {
              teal: 'bg-teal-50 text-teal-700',
              amber: 'bg-amber-50 text-amber-700',
              sky: 'bg-sky-50 text-sky-700',
              emerald: 'bg-emerald-50 text-emerald-700',
              indigo: 'bg-indigo-50 text-indigo-700'
            };

            return (
              <button
                key={item.label}
                onClick={item.action}
                className="text-left cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between min-h-[118px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </span>

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[item.color]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">
                    {loading ? '...' : item.value}
                  </p>

                  <p className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center">
                    View details
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </p>
                </div>
              </button>
            );
          })}

        </div>
      </div>

      {/* Main dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Appointments */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-teal-600" />

              <h2 className="text-base font-bold text-slate-900">
                Clinical Appointments
              </h2>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-3 py-1.5 rounded-lg ${
                  activeTab === 'today'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Today ({metrics.todayCount})
              </button>

              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-3 py-1.5 rounded-lg ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-sky-800 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Upcoming ({metrics.upcomingCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />

              <p className="text-xs text-slate-400 mt-2">
                Loading appointments from Supabase...
              </p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />

              <h4 className="font-bold text-slate-800 text-sm">
                {activeTab === 'today'
                  ? 'No appointments scheduled for today'
                  : 'No upcoming appointments'}
              </h4>

              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Admin-approved patient appointments will appear here.
                Configure availability slots to receive bookings.
              </p>

              <Link
                to="/doctor/manage-slots"
                className="inline-flex items-center space-x-1.5 text-xs text-teal-600 font-bold mt-2"
              >
                <span>Manage availability</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {currentList.map(apt => (
                <div
                  key={apt.id}
                  className="border border-slate-200 rounded-2xl p-4 space-y-3 hover:bg-slate-50/50"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">

                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 bg-teal-100 text-teal-800 rounded-xl flex items-center justify-center font-extrabold">
                        {(apt.patientName || 'P').charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {apt.patientName || 'Registered Patient'}
                          </span>

                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {apt.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium text-slate-700">
                            {apt.date} at {apt.time}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        disabled={actionLoadingId === apt.id}
                        onClick={() => handleQuickComplete(apt.id)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs disabled:opacity-50 flex items-center space-x-1"
                      >
                        {actionLoadingId === apt.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}

                        <span>Complete</span>
                      </button>

                      <button
                        onClick={() => navigate(
                          `/doctor/visit-summary?appointmentId=${apt.id}`
                        )}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Summary</span>
                      </button>

                      {apt.patientId && (
                        <button
                          onClick={() => navigate(
                            `/doctor/patient-record/${apt.patientId}`
                          )}
                          className="text-slate-400 hover:text-teal-700 p-2 rounded-xl hover:bg-slate-100"
                          title="Open patient record"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-800">
                      Consultation reason:{' '}
                    </span>

                    {apt.symptoms ||
                      apt.consultationReason ||
                      apt.reason ||
                      'No reason provided.'}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">
              Live appointment records
            </span>

            <Link
              to="/doctor/appointments"
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center space-x-1"
            >
              <span>View Full Appointment Roster</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Appointment distribution */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-teal-600" />
                <span>Appointment Distribution</span>
              </h3>

              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Live data
              </span>
            </div>

            {metrics.statusDistribution.some(
              item => item.count > 0
            ) ? (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.statusDistribution.filter(
                          item => item.count > 0
                        )}
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {metrics.statusDistribution
                          .filter(item => item.count > 0)
                          .map(item => (
                            <Cell
                              key={item.name}
                              fill={item.color}
                            />
                          ))}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {metrics.statusDistribution.map(item => (
                    <div
                      key={item.name}
                      className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-100"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />

                      <span className="text-slate-600 text-[10px] font-medium">
                        {item.name}
                      </span>

                      <strong className="text-slate-900 text-xs ml-auto">
                        {item.count}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No appointment volume data available yet.
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-100 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4" />
                <span>Today's Availability</span>
              </span>

              <span className="text-xs bg-teal-600 text-white font-bold px-2.5 py-1 rounded-full">
                {metrics.availableSlotsCount} Open
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Manage your consultation schedule so patients can view
              and book available time slots.
            </p>

            <Link
              to="/doctor/manage-slots"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manage Availability</span>
            </Link>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-teal-600" />

                <h3 className="font-bold text-slate-900 text-sm">
                  Recent Alerts
                </h3>
              </div>

              <Link
                to="/doctor/notifications"
                className="text-[11px] font-bold text-teal-700"
              >
                View All
              </Link>
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No notifications available.
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1"
                  >
                    <span className="font-bold text-slate-900 block">
                      {notification.title}
                    </span>

                    <p className="text-[11px] text-slate-500">
                      {notification.message}
                    </p>

                    <span className="text-[10px] text-slate-400 block">
                      {notification.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Practice report */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowReportModal(true)}
          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Generate Practice Report</span>
        </button>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  MediConnect Practice Report
                </h2>

                <p className="text-xs text-slate-500">
                  Physician performance summary
                </p>
              </div>

              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5 space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-xl font-black text-slate-900">
                  MediConnect Hospital
                </h3>

                <p className="text-xs text-slate-500">
                  Physician Performance Summary
                </p>

                <p className="text-sm font-bold text-slate-900 mt-3">
                  {doctorName}
                </p>

                <p className="text-xs text-slate-500">
                  {specialty} | {qualification}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {[
                  ['Appointments Today', metrics.todayCount],
                  ['Upcoming', metrics.upcomingCount],
                  ['Completed', metrics.completedCount],
                  ['Available Slots Today', metrics.availableSlotsCount],
                  ['Unique Patients', metrics.totalPatientsSeen]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200"
                  >
                    <span className="block text-slate-500 text-[10px] font-semibold">
                      {label}
                    </span>

                    <strong className="block text-lg text-slate-900 mt-1">
                      {value}
                    </strong>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-400">
                Report generated on {new Date().toLocaleDateString()}.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-3 rounded-xl flex items-center justify-center space-x-2 w-full"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}