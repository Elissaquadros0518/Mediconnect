import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, LogOut, User } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 h-16 px-6 flex items-center justify-between shadow-sm">
      {/* Brand Logo */}
      <div 
        className="flex items-center space-x-3 cursor-pointer" 
        onClick={() => navigate(user ? `/${user.role}/dashboard` : '/')}
      >
        <div className="bg-teal-600 text-white p-2 rounded-xl shadow-sm">
          <Activity className="w-5 h-5" />
        </div>
        <span className="font-extrabold text-lg text-slate-900 tracking-tight">
          MediConnect <span className="text-teal-600">Cloud</span>
        </span>
      </div>

      {/* Right Section: User Profile & Logout */}
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{user.name}</p>
              <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">{user.role}</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-700">
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
  );
}