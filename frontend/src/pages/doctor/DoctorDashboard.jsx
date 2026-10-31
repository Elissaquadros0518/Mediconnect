import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, Clock, Users, CheckCircle2, AlertCircle, Stethoscope, 
  ChevronRight, ArrowUpRight, Plus, FileText, Bell, Loader2, Sparkles,
  PieChart as PieIcon, Activity, UserCheck
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { notificationService } from '../../services/notificationService';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
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
  });

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'pending' | 'upcoming'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [dashMetrics, docProf, notifs] = await Promise.all([
          appointmentService.getDoctorMetrics(user.id),
          doctorService.getDoctorProfileByUserId(user.id),
          notificationService.getUserNotifications(user.id, 'doctor')
        ]);

        setMetrics(dashMetrics);
        setDoctorProfile(docProf);
        setNotifications(notifs.slice(0, 3)); // 3 most recent
      } catch (err) {
        console.error('Error loading doctor dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user?.id]);

  const handleQuickConfirm = async (appointmentId) => {
    setActionLoadingId(appointmentId);
    try {
      await appointmentService.confirmAppointment(appointmentId);
      // Refresh metrics
      const updated = await appointmentService.getDoctorMetrics(user.id);
      setMetrics(updated);
    } catch (err) {
      alert(`Could not confirm appointment: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickReject = async (appointmentId) => {
    const reason = prompt('Please provide a reason for declining this consultation request:');
    if (!reason) return;

    setActionLoadingId(appointmentId);
    try {
      await appointmentService.rejectAppointment(appointmentId, reason);
      const updated = await appointmentService.getDoctorMetrics(user.id);
      setMetrics(updated);
    } catch (err) {
      alert(`Could not reject appointment: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickComplete = async (appointmentId) => {
    setActionLoadingId(appointmentId);
    try {
      await appointmentService.completeAppointment(appointmentId);
      const updated = await appointmentService.getDoctorMetrics(user.id);
      setMetrics(updated);
    } catch (err) {
      alert(`Could not complete consultation: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const currentList = 
    activeTab === 'today' ? metrics.todayAppointments :
    activeTab === 'pending' ? metrics.pendingRequests :
    metrics.upcomingAppointments;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* Refined Hero Section with Professional Doctor Avatar */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-teal-700/30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Doctor Profile Header with Professional Avatar */}
          <div className="flex items-start sm:items-center space-x-4 sm:space-x-5">
            {/* Professional Doctor Avatar with Verification Ring */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-500 p-0.5 shadow-md flex items-center justify-center ring-4 ring-white/10">
                <div className="w-full h-full bg-teal-950 rounded-[14px] flex items-center justify-center text-teal-100 font-extrabold text-xl sm:text-2xl tracking-tight shadow-inner">
                  {(doctorProfile?.name || user?.name || 'Dr. S')
                    .replace('Dr. ', '')
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
              </div>
              <div 
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] shadow-sm ${
                  doctorProfile?.verificationStatus === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'
                }`}
                title={doctorProfile?.verificationStatus === 'APPROVED' ? 'Verified Physician' : 'Credentials Under Hospital Review'}
              >
                {doctorProfile?.verificationStatus === 'APPROVED' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5 font-bold" />
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-white/10 text-teal-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 backdrop-blur-sm border border-white/10">
                  <Stethoscope className="w-3 h-3 text-teal-300" />
                  <span>Physician Portal</span>
                </span>

                {doctorProfile?.verificationStatus && (
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    doctorProfile.verificationStatus === 'APPROVED' 
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' 
                      : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                  }`}>
                    {doctorProfile.verificationStatus === 'APPROVED' ? 'Verified Physician' : 'Verification Pending'}
                  </span>
                )}

                {user?.isDemo && (
                  <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    DEMO DATA
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white truncate">
                Welcome back, {doctorProfile?.name || user?.name || 'Doctor'}
              </h1>

              <p className="text-teal-200/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
                <strong className="text-white font-semibold">{doctorProfile?.specialty || 'Cardiology'} Specialist</strong> • {doctorProfile?.qualification || 'Consultant Physician'} • Reg: <span className="text-teal-100 font-mono font-medium">{doctorProfile?.registrationNumber || 'MCI-2012-98421'}</span>
              </p>
            </div>
          </div>

          {/* Quick Top Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
            <Link
              to="/doctor/manage-slots"
              className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-3 rounded-2xl border border-white/20 shadow-sm transition flex items-center justify-center space-x-2"
            >
              <Clock className="w-4 h-4 text-teal-300" />
              <span>Manage Slots</span>
            </Link>
            <Link
              to="/doctor/visit-summary"
              className="flex-1 sm:flex-none bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold px-4 py-3 rounded-2xl shadow-sm transition flex items-center justify-center space-x-2 font-bold"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>New Visit Summary</span>
            </Link>
            <Link
              to="/doctor/profile"
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition hidden sm:flex items-center justify-center"
              title="Profile Settings"
            >
              <UserCheck className="w-4 h-4 text-teal-200" />
            </Link>
          </div>
        </div>
      </div>

      {/* Refined Pending Verification Notice Banner with Improved Spacing */}
      {doctorProfile?.verificationStatus === 'PENDING' && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/40 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 bg-amber-200/80 text-amber-900 rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-amber-950 text-sm">Credentials Verification Under Hospital Review</p>
                <p className="text-amber-800 leading-relaxed max-w-3xl">
                  Your physician account is registered in <strong className="font-bold text-amber-950">PENDING</strong> verification status. Profile directory discovery and public booking become active once approved by administration. You retain full access to manage slots, clinical triage, and consultation notes.
                </p>
              </div>
            </div>
            <Link
              to="/doctor/profile"
              className="text-xs font-bold text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-3.5 py-1.5 rounded-xl border border-amber-300 transition whitespace-nowrap self-end sm:self-center"
            >
              Review Credentials
            </Link>
          </div>
        </div>
      )}

      {/* Refined 6 KPI Metric Cards with Consistent Dimensions and Sizing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Clinical Practice Performance Metrics</span>
          </h2>
          {user?.isDemo && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full shadow-sm">
              Simulated Demo Metrics
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* 1. Today's Appointments */}
          <div 
            onClick={() => { setActiveTab('today'); }}
            className={`cursor-pointer bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[118px] ${
              activeTab === 'today' ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/30' : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metrics.todayCount}</p>
              <p className="text-[10px] text-teal-700 font-bold mt-1 flex items-center">
                <span>View Today</span>
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </p>
            </div>
          </div>

          {/* 2. Pending Requests */}
          <div 
            onClick={() => { setActiveTab('pending'); }}
            className={`cursor-pointer bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[118px] ${
              activeTab === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30' : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">{metrics.pendingCount}</p>
              <p className="text-[10px] text-amber-700 font-bold mt-1 flex items-center">
                <span>Awaiting Review</span>
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </p>
            </div>
          </div>

          {/* 3. Upcoming Appointments */}
          <div 
            onClick={() => { setActiveTab('upcoming'); }}
            className={`cursor-pointer bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[118px] ${
              activeTab === 'upcoming' ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30' : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Upcoming</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metrics.upcomingCount}</p>
              <p className="text-[10px] text-sky-700 font-bold mt-1 flex items-center">
                <span>Scheduled Ahead</span>
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </p>
            </div>
          </div>

          {/* 4. Completed Consultations */}
          <div 
            onClick={() => navigate('/doctor/appointments?status=COMPLETED')}
            className="cursor-pointer bg-white border border-slate-200/90 hover:border-emerald-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[118px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metrics.completedCount}</p>
              <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center">
                <span>Consultations</span>
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </p>
            </div>
          </div>

          {/* 5. Available Slots */}
          <div 
            onClick={() => navigate('/doctor/manage-slots')}
            className="cursor-pointer bg-white border border-slate-200/90 hover:border-teal-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[118px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Open Slots</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metrics.availableSlotsCount}</p>
              <p className="text-[10px] text-teal-700 font-bold mt-1 flex items-center">
                <span>Calendar Slots</span>
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </p>
            </div>
          </div>

          {/* 6. Total Patients Seen */}
          <div 
            onClick={() => navigate('/doctor/patients')}
            className="cursor-pointer bg-white border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[118px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Patients</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metrics.totalPatientsSeen}</p>
              <p className="text-[10px] text-indigo-700 font-bold mt-1 flex items-center">
                <span>Care Vaults</span>
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Layout: Left Schedule/Triage + Right Schedule Summary & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Active Roster Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">Clinical Triage & Appointments</h2>
              </div>

              {/* Roster Filter Tabs */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'today' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today ({metrics.todayCount})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'pending' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending Requests ({metrics.pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'upcoming' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upcoming ({metrics.upcomingCount})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Loading appointments from Supabase...</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {activeTab === 'today' ? 'No Appointments Scheduled For Today' :
                   activeTab === 'pending' ? 'All Pending Requests Cleared' :
                   'No Upcoming Appointments Scheduled'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {activeTab === 'pending' 
                    ? 'New appointment requests from patients will appear here for review and confirmation.' 
                    : 'Configure available consultation time slots to receive new patient bookings.'}
                </p>
                <Link
                  to="/doctor/manage-slots"
                  className="inline-flex items-center space-x-1.5 text-xs text-teal-600 hover:text-teal-800 font-bold mt-2"
                >
                  <span>Configure Calendar Availability</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {currentList.map((apt) => {
                  const isConfirmed = apt.status === 'CONFIRMED';
                  const isPending = apt.status === 'PENDING';
                  const isCompleted = apt.status === 'COMPLETED';

                  return (
                    <div 
                      key={apt.id} 
                      className={`border rounded-2xl p-4 sm:p-4.5 transition-all space-y-3 ${
                        isConfirmed ? 'border-l-4 border-l-emerald-500 border-slate-200/80 bg-white hover:bg-emerald-50/15 shadow-sm' :
                        isPending ? 'border-l-4 border-l-amber-500 border-amber-200/80 bg-amber-50/25 hover:bg-amber-50/40 shadow-sm' :
                        isCompleted ? 'border-l-4 border-l-sky-500 border-slate-200/80 bg-slate-50/60 hover:bg-sky-50/20' :
                        'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center space-x-3.5">
                          {/* Distinct Colored Patient Avatar Based on Status */}
                          <div className={`w-10 h-10 sm:w-11 sm:h-11 font-extrabold rounded-xl flex items-center justify-center text-sm shadow-sm shrink-0 ring-2 ${
                            isConfirmed ? 'bg-emerald-100 text-emerald-800 ring-emerald-200/60' :
                            isPending ? 'bg-amber-100 text-amber-900 ring-amber-200/70' :
                            isCompleted ? 'bg-sky-100 text-sky-800 ring-sky-200/60' :
                            'bg-slate-100 text-slate-700 ring-slate-200'
                          }`}>
                            {apt.patientName.replace(' (DEMO)', '').charAt(0)}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1 border ${
                                isConfirmed ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                isPending ? 'bg-amber-100 text-amber-900 border-amber-300' :
                                isCompleted ? 'bg-sky-100 text-sky-800 border-sky-300' :
                                'bg-slate-200 text-slate-700 border-slate-300'
                              }`}>
                                {isConfirmed && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                                {isPending && <Clock className="w-3 h-3 text-amber-700" />}
                                {isCompleted && <Sparkles className="w-3 h-3 text-sky-700" />}
                                <span>{apt.status}</span>
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-slate-700">{apt.date} at {apt.time}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-teal-700 font-semibold">{apt.specialty || 'General Consultation'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center space-x-2 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                          {isPending && (
                            <>
                              <button
                                disabled={actionLoadingId === apt.id}
                                onClick={() => handleQuickConfirm(apt.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm</span>
                              </button>
                              <button
                                disabled={actionLoadingId === apt.id}
                                onClick={() => handleQuickReject(apt.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl font-bold text-xs transition disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {isConfirmed && (
                            <>
                              <button
                                disabled={actionLoadingId === apt.id}
                                onClick={() => handleQuickComplete(apt.id)}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Completed</span>
                              </button>
                              <button
                                onClick={() => navigate(`/doctor/visit-summary?appointmentId=${apt.id}`)}
                                className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Summary</span>
                              </button>
                            </>
                          )}

                          {apt.patientId && (
                            <button
                              onClick={() => navigate(`/doctor/patient-record/${apt.patientId}`)}
                              className="text-slate-400 hover:text-teal-700 p-2 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
                              title="Open Patient Clinical Vault"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reported Reason / Symptoms */}
                      <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        isPending ? 'bg-amber-100/40 border-amber-200 text-amber-950' :
                        isConfirmed ? 'bg-slate-50 border-slate-200 text-slate-700' :
                        'bg-white border-slate-100 text-slate-600'
                      }`}>
                        <span className="font-bold text-slate-800">Clinical Reason: </span>
                        {apt.symptoms || apt.consultationReason}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">
                {user?.isDemo ? 'Viewing simulated clinical triage records (DEMO DATA)' : 'Viewing real doctor appointments synced via Supabase RLS'}
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
        </div>

        {/* Right Column (1 Col): Analytics, Schedule Widget, Notifications */}
        <div className="space-y-6">
          
          {/* Status Breakdown Analytics Chart (Section 13) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-teal-600" />
                <span>Appointment Distribution</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {user?.isDemo ? 'DEMO DATA' : 'Real-time'}
              </span>
            </div>

            {metrics.statusDistribution.length > 0 && metrics.statusDistribution.some(s => s.count > 0) ? (
              <div className="space-y-3">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.statusDistribution}
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {metrics.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {metrics.statusDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-slate-600 text-[11px] font-medium">{entry.name}:</span>
                      <strong className="text-slate-900 text-xs ml-auto">{entry.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                <p>No appointment volume data available yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Metrics update automatically as consultations are booked.</p>
              </div>
            )}
          </div>

          {/* Quick Schedule Management Card */}
          <div className="bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-100 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>Availability Summary</span>
              </span>
              <span className="text-xs bg-teal-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                {metrics.availableSlotsCount} Open Slots
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintain an active availability schedule so patients can view and book consultation time slots on MediConnect.
            </p>
            <div className="pt-1">
              <Link
                to="/doctor/manage-slots"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open Calendar Slots</span>
              </Link>
            </div>
          </div>

          {/* Recent Notifications Widget */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Alerts</h3>
              </div>
              <Link to="/doctor/notifications" className="text-[11px] font-bold text-teal-700 hover:text-teal-900">
                View All
              </Link>
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No unread notifications.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <span className="font-bold text-slate-900 block leading-tight">{n.title}</span>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{n.message}</p>
                    <span className="text-[10px] text-slate-400 block">{n.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}