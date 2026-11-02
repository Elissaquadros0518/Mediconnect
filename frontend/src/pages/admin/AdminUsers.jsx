import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Trash2, UserCheck, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const data = await adminService.getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const [updatingId, setUpdatingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole.charAt(0) + newRole.slice(1).toLowerCase() } : u));
      setSuccessMsg(`User role successfully updated to ${newRole}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Role update error:', err);
      setErrorMsg(err.message || 'Failed to update user role.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Access Control
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Registered System Users</h1>
        <p className="text-teal-100 text-sm mt-1">Manage patient and practitioner accounts, permissions, and security roles in PostgreSQL.</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">User Directory ({users.length})</h3>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading user accounts...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{u.name}</span>
                  <p className="text-xs text-slate-500">{u.email} • Current Role: <strong className="text-teal-700">{u.role}</strong></p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {u.status}
                  </span>
                  <select
                    disabled={updatingId === u.id}
                    value={u.role.toUpperCase()}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1 border border-slate-200 rounded-xl bg-white text-slate-700 hover:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="PATIENT">Patient</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}