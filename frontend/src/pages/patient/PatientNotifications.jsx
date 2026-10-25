import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCircle2, Calendar, FileText, Pill, AlertTriangle, ArrowLeft, Trash2, ShieldCheck, ExternalLink 
} from 'lucide-react';

export default function PatientNotifications() {
  const navigate = useNavigate();

  // Mock initial notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'report',
      title: 'New Medical Report Uploaded',
      message: 'Your Chest X-Ray Report has been securely uploaded and encrypted to your AWS S3 vault.',
      time: '10 minutes ago',
      read: false,
      link: '/patient/records'
    },
    {
      id: 2,
      type: 'appointment',
      title: 'Appointment Confirmed',
      message: 'Your consultation with Dr. Rajesh Sharma (Cardiology) is confirmed for Nov 2, 2026 at 10:30 AM.',
      time: '2 hours ago',
      read: false,
      link: '/patient/dashboard'
    },
    {
      id: 3,
      type: 'prescription',
      title: 'Prescription Refill Reminder',
      message: 'Your active prescription for Atorvastatin 20mg has 2 refills remaining.',
      time: '1 day ago',
      read: true,
      link: '/patient/dashboard'
    },
    {
      id: 4,
      type: 'system',
      title: 'Security Verification Complete',
      message: 'Your patient account zero-trust S3 encryption keys were successfully rotated.',
      time: '3 days ago',
      read: true,
      link: null
    }
  ]);

  const handleMarkAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleDeleteOne = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/patient/dashboard')}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Patient Alert System</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Notifications & Activity Feed</h1>
          <p className="text-teal-100 text-sm mt-1">Stay updated on your health records, doctor messages, and appointment status.</p>
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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <span>Recent Alerts</span>
          </h2>
          <span className="text-xs bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-full">
            {unreadCount} Unread
          </span>
        </div>

        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div 
                key={item.id} 
                className={`border rounded-2xl p-4 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  item.read ? 'border-slate-100 bg-slate-50/40' : 'border-teal-200 bg-teal-50/20 shadow-sm'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {!item.read && <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>}
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    <span className="text-[10px] text-slate-400">• {item.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4 sm:pl-0">{item.message}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {item.link && (
                    <button 
                      onClick={() => navigate(item.link)}
                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 p-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                      title="View Details"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!item.read && (
                    <button 
                      onClick={() => handleMarkAsRead(item.id)}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-700 p-2 rounded-xl text-xs font-semibold transition"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteOne(item.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-xl text-xs transition"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center space-y-3">
              <Bell className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No notifications</h3>
              <p className="text-xs text-slate-500">You are all caught up! No unread system alerts or messages.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}