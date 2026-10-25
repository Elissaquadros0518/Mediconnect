import React, { useState } from 'react';
import { Users, ShieldCheck, Trash2, UserCheck } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([
    { id: 1, name: 'elissa', email: 'quadroselissa1810@gmail.com', role: 'Patient', status: 'Active' },
    { id: 2, name: 'Amit Patel', email: 'amit.patel@example.com', role: 'Patient', status: 'Active' },
    { id: 3, name: 'Priya Deshmukh', email: 'priya.d@example.com', role: 'Patient', status: 'Active' }
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      <div className="bg-gradient-to-r from-teal-700 to-sky-800 rounded-3xl p-6 md:p-8 text-white shadow-md">
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Access Control
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Registered System Users</h1>
        <p className="text-teal-100 text-sm mt-1">Manage patient accounts, permissions, and security roles.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">User Directory ({users.length})</h3>
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{u.name}</span>
                <p className="text-xs text-slate-500">{u.email} • Role: <strong className="text-teal-700">{u.role}</strong></p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {u.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}