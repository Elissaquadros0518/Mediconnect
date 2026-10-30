import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Activity, LogOut, User, Menu, X, 
  LayoutDashboard, Calendar, Clock, Users, ClipboardList, 
  Bell, Settings, FileText, UserCheck, ShieldCheck 
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const path = location.pathname;
  const isDoctor = path.startsWith('/doctor') || user?.role === 'doctor';
  const isPatient = path.startsWith('/patient') || user?.role === 'patient';
  const isAdmin = path.startsWith('/admin') || user?.role === 'admin';

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 h-16 px-4 sm:px-6 flex items-center justify-between shadow-sm">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center space-x-3">
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl md:hidden transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div 
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer" 
            onClick={() => {
              closeMenu();
              navigate(user ? `/${user.role}/dashboard` : '/');
            }}
          >
            <div className="bg-teal-600 text-white p-2 rounded-xl shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
              MediConnect <span className="text-teal-600">Cloud</span>
            </span>
          </div>
        </div>

        {/* Right Section: User Profile & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">{user.role}</p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-700">
                <User className="w-4 h-4" />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow hover:bg-teal-700 transition"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Mobile Drawer Menu (Visible on screen < md when toggled) */}
      {mobileMenuOpen && user && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex">
          <div className="w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between p-4 animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-teal-600 text-white p-1.5 rounded-lg shadow-sm">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 leading-tight">MediConnect</p>
                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">{user.role} Portal</p>
                  </div>
                </div>
                <button 
                  onClick={closeMenu} 
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Doctor Navigation Links */}
              {user.role === 'doctor' && (
                <nav className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Physician Navigation</p>
                  <Link 
                    to="/doctor/dashboard" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/dashboard' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    to="/doctor/appointments" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/appointments' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Appointments</span>
                  </Link>
                  <Link 
                    to="/doctor/manage-slots" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/manage-slots' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Manage Slots</span>
                  </Link>
                  <Link 
                    to="/doctor/patients" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/patients' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Patient Directory</span>
                  </Link>
                  <Link 
                    to="/doctor/visit-summary" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/visit-summary' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Visit Summary Editor</span>
                  </Link>
                  <Link 
                    to="/doctor/notifications" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/notifications' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </Link>
                  <Link 
                    to="/doctor/profile" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/doctor/profile' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </Link>
                </nav>
              )}

              {/* Patient Navigation Links */}
              {user.role === 'patient' && (
                <nav className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Patient Portal</p>
                  <Link 
                    to="/patient/dashboard" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/dashboard' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    to="/patient/book-appointment" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/book-appointment' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Appointment</span>
                  </Link>
                  <Link 
                    to="/patient/records" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/records' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Medical Records Vault</span>
                  </Link>
                  <Link 
                    to="/patient/notifications" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/notifications' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </Link>
                  <Link 
                    to="/patient/profile" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/patient/profile' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </Link>
                </nav>
              )}

              {/* Admin Navigation Links */}
              {user.role === 'admin' && (
                <nav className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Admin Control Center</p>
                  <Link 
                    to="/admin/dashboard" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/dashboard' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>System Dashboard</span>
                  </Link>
                  <Link 
                    to="/admin/appointments" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/appointments' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>All Appointments</span>
                  </Link>
                  <Link 
                    to="/admin/doctors" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/doctors' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Doctor Management</span>
                  </Link>
                  <Link 
                    to="/admin/users" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/users' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                  </Link>
                  <Link 
                    to="/admin/audit-logs" 
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${path === '/admin/audit-logs' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Security Audit Logs</span>
                  </Link>
                </nav>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-3 px-2">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold text-xs">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={closeMenu} />
        </div>
      )}
    </>
  );
}
