import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2, UserX, UserCheck, Shield, Users, Filter } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['PATIENT', 'DOCTOR', 'ADMIN'];

const statusStyles = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DISABLED: 'bg-rose-50 text-rose-700 border-rose-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200'
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
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg border border-teal-700/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="bg-white/10 text-teal-200 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-white/10 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-300" />
                <span>Access Control & Security</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">User Management Directory</h1>
            <p className="text-teal-200/90 text-xs md:text-sm max-w-xl leading-relaxed">
              Supervise user roles, review account statuses, and manage platform permissions securely across patients, doctors, and administrators.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl flex items-center space-x-3 shrink-0">
            <div className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">Total Registered</p>
              <p className="text-xl font-black text-white">{users.length} Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-semibold flex items-center space-x-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Content Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
              User Directory ({filtered.length}{filtered.length !== users.length ? ` of ${users.length}` : ''})
            </h3>
            <p className="text-xs text-slate-400">Filter accounts by search query, assigned role, or status.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{label(r)}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DISABLED">Disabled Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading / Empty States */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-400">Synchronizing user accounts directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-1" />
            <p className="text-sm font-bold text-slate-700">No users match your criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your search terms or filter selections.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(u => {
              const isSelf = u.id === currentUser?.id;
              const busy = busyId === u.id;
              return (
                <div
                  key={u.id}
                  className="border border-slate-200/80 bg-white hover:bg-slate-50/60 transition-all rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-sm md:text-base">
                        {u.name || 'Unnamed User'}
                      </span>
                      {isSelf && (
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>📱 {u.phone || 'No phone registered'}</span>
                      <span>•</span>
                      <span>📅 Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* Role Dropdown */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">Role:</span>
                      <select
                        value={u.role}
                        disabled={isSelf || busy}
                        onChange={e => handleRoleChange(u, e.target.value)}
                        title={isSelf ? 'You cannot change your own role' : 'Change role'}
                        className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{label(r)}</option>)}
                      </select>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border ${statusStyles[u.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      ● {label(u.status || 'ACTIVE')}
                    </span>

                    {/* Disable / Enable Action Button */}
                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={isSelf || busy}
                      title={isSelf ? 'You cannot disable your own account' : ''}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs ${
                        u.status === 'ACTIVE'
                          ? 'border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100'
                          : 'border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : u.status === 'ACTIVE' ? (
                        <UserX className="w-3.5 h-3.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{u.status === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}</span>
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