import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2, UserX, UserCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['PATIENT', 'DOCTOR', 'ADMIN'];

const statusStyles = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  DISABLED: 'bg-rose-100 text-rose-800',
  PENDING: 'bg-amber-100 text-amber-800'
};

const label = (v) => v.charAt(0) + v.slice(1).toLowerCase();

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError('');
      try {
        setUsers(await adminService.getAllUsers());
      } catch (err) {
        console.error('Error loading users:', err);
        setError(err.message || 'Failed to load users.');
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return users.filter(u =>
      (roleFilter === 'ALL' || u.role === roleFilter) &&
      (statusFilter === 'ALL' || u.status === statusFilter) &&
      (!s || u.name?.toLowerCase().includes(s) || u.phone?.includes(s))
    );
  }, [users, search, roleFilter, statusFilter]);

  const patchUser = (id, changes) =>
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...changes } : u)));

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleToggleStatus = async (u) => {
    const next = u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    if (!window.confirm(`${next === 'DISABLED' ? 'Disable' : 'Enable'} account for ${u.name}?`)) return;
    setBusyId(u.id);
    setError('');
    setSuccessMsg('');
    try {
      await adminService.updateUserStatus(u.id, next);
      patchUser(u.id, { status: next });
      showSuccess(`${u.name}'s account is now ${label(next)}.`);
    } catch (err) {
      setError(err.message || 'Could not update account status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async (u, role) => {
    if (role === u.role) return;
    if (!window.confirm(`Change ${u.name}'s role from ${label(u.role)} to ${label(role)}?`)) return;
    setBusyId(u.id);
    setError('');
    setSuccessMsg('');
    try {
      await adminService.updateUserRole(u.id, role);
      patchUser(u.id, { role });
      showSuccess(`${u.name}'s role successfully updated to ${label(role)}.`);
    } catch (err) {
      setError(err.message || 'Could not update role.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Access Control
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-2">User Management</h1>
        <p className="text-teal-100 text-sm mt-1">Enable or disable accounts and change user roles.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            User Directory ({filtered.length}{filtered.length !== users.length ? ` of ${users.length}` : ''})
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or phone"
                className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
            >
              <option value="ALL">All roles</option>
              {ROLES.map(r => <option key={r} value={r}>{label(r)}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading user accounts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No users match your filters.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(u => {
              const isSelf = u.id === currentUser?.id;
              const busy = busyId === u.id;
              return (
                <div
                  key={u.id}
                  className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {u.name} {isSelf && <span className="text-[10px] font-semibold text-slate-400">(you)</span>}
                    </span>
                    <p className="text-xs text-slate-500">
                      {u.phone || 'No phone'} • Joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={u.role}
                      disabled={isSelf || busy}
                      onChange={e => handleRoleChange(u, e.target.value)}
                      title={isSelf ? 'You cannot change your own role' : 'Change role'}
                      className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white disabled:opacity-60"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{label(r)}</option>)}
                    </select>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusStyles[u.status] || 'bg-slate-100 text-slate-700'}`}>
                      {label(u.status)}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={isSelf || busy}
                      title={isSelf ? 'You cannot disable your own account' : ''}
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        u.status === 'ACTIVE'
                          ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : u.status === 'ACTIVE' ? (
                        <UserX className="w-3.5 h-3.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
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