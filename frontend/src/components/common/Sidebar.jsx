import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, FileText, Users, ShieldCheck, UserCheck, 
  Clock, Activity, Settings, Bell, ClipboardList 
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  // Determine which navigation links to show based on URL path
  const isPatient = path.startsWith('/patient');
  const isDoctor = path.startsWith('/doctor');
  const isAdmin = path.startsWith('/admin');

  // If on public pages like Landing or Login, don't render sidebar
  if (!isPatient && !isDoctor && !isAdmin) return null;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        
        {/* Patient Sidebar Navigation */}
        {isPatient && (
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Patient Portal</p>
            <Link to="/patient/dashboard" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/dashboard' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/patient/book-appointment" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/book-appointment' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
            <Link to="/patient/records" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/records' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <FileText className="w-4 h-4" />
              <span>Medical Records Vault</span>
            </Link>
            <Link to="/patient/notifications" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/notifications' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </Link>
            <Link to="/patient/profile" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/profile' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Settings className="w-4 h-4" />
              <span>Profile Settings</span>
            </Link>
          </div>
        )}

        {/* Doctor Sidebar Navigation (Includes Manage Slots & Visit Summary) */}
        {isDoctor && (
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Physician Portal</p>
            <Link to="/doctor/dashboard" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/dashboard' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/doctor/appointments" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/appointments' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Calendar className="w-4 h-4" />
              <span>Appointments</span>
            </Link>
            <Link to="/doctor/manage-slots" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/manage-slots' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Clock className="w-4 h-4" />
              <span>Manage Slots</span>
            </Link>
            <Link to="/doctor/visit-summary" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/visit-summary' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <ClipboardList className="w-4 h-4" />
              <span>Visit Summary Editor</span>
            </Link>
          </div>
        )}

        {/* Admin Sidebar Navigation */}
        {isAdmin && (
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Admin Control Center</p>
            <Link to="/admin/dashboard" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/dashboard' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <LayoutDashboard className="w-4 h-4" />
              <span>System Dashboard</span>
            </Link>
            <Link to="/admin/appointments" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/appointments' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Calendar className="w-4 h-4" />
              <span>All Appointments</span>
            </Link>
            <Link to="/admin/doctors" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/doctors' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <UserCheck className="w-4 h-4" />
              <span>Doctor Management</span>
            </Link>
            <Link to="/admin/users" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/users' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </Link>
            <Link to="/admin/audit-logs" className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/audit-logs' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <ShieldCheck className="w-4 h-4" />
              <span>Security Audit Logs</span>
            </Link>
          </div>
        )}

      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="bg-teal-50 p-3 rounded-2xl flex items-center space-x-3">
          <div className="p-2 bg-teal-600 text-white rounded-xl">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-teal-900">MediConnect Cloud</p>
            <p className="text-[10px] text-teal-700">AWS S3 Secured</p>
          </div>
        </div>
      </div>
    </aside>
  );
}