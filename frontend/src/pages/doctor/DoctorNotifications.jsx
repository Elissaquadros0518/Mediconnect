import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, CheckCircle2, ArrowLeft, Trash2, ShieldCheck, ExternalLink, 
  Loader2, AlertCircle, Clock, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

export default function DoctorNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const notifs = await notificationService.getUserNotifications(user.id, 'doctor');
      setNotifications(notifs);
    } catch (err) {
      console.error('Error loading doctor notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const handleMarkAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleClearAll = async () => {
    if (!user?.id) return;
    await notificationService.clearAll(user.id);
    setNotifications([]);
  };

  const handleDeleteOne = async (id) => {
    await notificationService.deleteOne(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/doctor/dashboard')}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clinical Activity & Alert Dispatch</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">Physician Notifications</h1>
          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-xl">
            Real-time PostgreSQL notifications for incoming consultation requests, patient cancellations, and clinical summary updates.
          </p>
        </div>
        
        {notifications.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Notifications List Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">Alerts & Messages</h3>
          </div>
          {unreadCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {unreadCount} Unread
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">All Caught Up!</p>
            <p className="text-xs">No pending notifications in your physician account.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`border rounded-2xl p-4 transition flex justify-between items-start gap-4 ${
                  notif.read ? 'bg-slate-50/50 border-slate-100' : 'bg-teal-50/30 border-teal-200 shadow-sm'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{notif.time}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {notif.link && (
                    <Link
                      to={notif.link}
                      className="p-2 text-slate-400 hover:text-teal-600 rounded-xl hover:bg-slate-100"
                      title="Open details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-xs text-teal-700 hover:text-teal-900 font-bold px-2 py-1 rounded-lg"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteOne(notif.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition"
                    title="Delete alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
