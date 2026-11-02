import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Users, UserCheck, Calendar, FileText, ArrowRight, 
  Activity, Server, AlertCircle, Loader2, CheckCircle2, Search,
  Package, AlertTriangle, Truck, Clock, RefreshCw, XCircle, ChevronRight
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { appointmentService } from '../../services/appointmentService';
import { inventoryService } from '../../services/inventoryService';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    patientCount: 1248,
    doctorCount: 42,
    appointmentCount: 86,
    systemUptime: '99.98%'
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'patients' | 'appointments' | 'inventory'
  
  // Interactive Hub States
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryMetrics, setInventoryMetrics] = useState({ lowStockCount: 0 });
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [sysMetrics, docRoster, userList, apptList, invItems, invMet] = await Promise.all([
        adminService.getSystemMetrics(),
        adminService.getDoctorRoster(),
        adminService.getAllUsers(),
        appointmentService.getAllAppointmentsAdmin({ status: 'ALL' }),
        inventoryService.getInventoryItems(),
        inventoryService.getInventoryMetrics()
      ]);

      setMetrics(sysMetrics);
      setDoctors(docRoster);
      setUsers(userList);
      setAppointments(apptList);
      setInventoryItems(invItems);
      setInventoryMetrics(invMet);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Doctor Approval Action
  const handleApproveDoctor = async (doctorProfileId) => {
    try {
      await adminService.approveDoctor(doctorProfileId);
      setDoctors(prev => prev.map(d => d.id === doctorProfileId ? { ...d, status: 'Active' } : d));
      setFeedbackMsg('Doctor credentialing approved! Specialist profile is now live for patient booking.');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    }
  };

  // Toggle User Status Action
  const handleToggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Disabled' : 'Active';
        setFeedbackMsg(`User "${u.name}" account status toggled to ${nextStatus}.`);
        setTimeout(() => setFeedbackMsg(''), 4000);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Override Appointment Status Action
  const handleOverrideAppointmentStatus = async (apptId, newStatus) => {
    try {
      await appointmentService.updateAppointmentStatus(apptId, newStatus);
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus } : a));
      setFeedbackMsg(`Appointment status overridden to ${newStatus}.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      alert(`Could not override status: ${err.message}`);
    }
  };

  // Quick Reorder Action
  const handleQuickReorder = async (item) => {
    await inventoryService.reorderStock(item.id, 50);
    const [invItems, invMet] = await Promise.all([
      inventoryService.getInventoryItems(),
      inventoryService.getInventoryMetrics()
    ]);
    setInventoryItems(invItems);
    setInventoryMetrics(invMet);
    setFeedbackMsg(`Batch reorder (+50 units) fulfilled for ${item.name}.`);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Filtered lists for interactive tabs
  const filteredDoctors = doctors.filter(d => 
    !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    !searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAppointments = appointments.filter(a => 
    !searchTerm || a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || a.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg border border-teal-700/30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/10 text-teal-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1.5 backdrop-blur-sm border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>Supabase Master Operations Center</span>
              </span>
              <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                DEMO DATA
              </span>
              <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                PostgreSQL Role: ADMIN
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              MediConnect Master Admin Dashboard
            </h1>
            <p className="text-teal-200/90 text-xs md:text-sm max-w-2xl leading-relaxed">
              Unified governance hub: Manage patient care records, verify specialist physician credentials, supervise hospital appointments, and oversee medical inventory stock levels.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shrink-0 w-full sm:w-auto">
            <p className="text-2xl font-black text-emerald-300">{metrics.systemUptime}</p>
            <p className="text-[11px] text-teal-200 uppercase tracking-wider font-bold">PostgreSQL Engine Uptime</p>
          </div>
        </div>
      </div>

      {/* Action Feedback Toast */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-semibold flex items-center space-x-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Patients</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.patientCount}</p>
          <p className="text-[10px] text-emerald-600 font-semibold">+18 new this week</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Specialists</span>
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.doctorCount}</p>
          <p className="text-[10px] text-slate-500">{doctors.filter(d => d.status === 'Pending Review').length} awaiting verification</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hospital Visits</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.appointmentCount}</p>
          <p className="text-[10px] text-slate-500">Across all hospital clinics</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inventory Health</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{inventoryItems.length} SKUs</p>
          <p className={`text-[10px] font-bold ${inventoryMetrics.lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {inventoryMetrics.lowStockCount} items below threshold
          </p>
        </div>
      </div>

      {/* Interactive Management Hub */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
        
        {/* Hub Header & Tab Switchers */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Activity className="w-5 h-5 text-teal-600" />
              <span>Interactive Clinical Operations Hub</span>
            </h2>
            <p className="text-xs text-slate-400">Directly manage doctors, supervise patient accounts, and resolve stock issues</p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl shrink-0 overflow-x-auto max-w-full">
            <button
              onClick={() => { setActiveTab('doctors'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'doctors' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Doctor Roster ({doctors.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('patients'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'patients' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Patient Directory ({users.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('appointments'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'appointments' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Appointments ({appointments.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('inventory'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'inventory' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Stock Alerts ({inventoryMetrics.lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Doctor Management Hub */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter doctor by name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <Link
                to="/admin/doctors"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center space-x-1"
              >
                <span>Full Doctor Management View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {filteredDoctors.map(doc => (
                <div key={doc.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 bg-teal-100 text-teal-800 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                      {doc.name.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-sm">{doc.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doc.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <strong className="text-slate-700">{doc.specialty}</strong> • License: <span className="font-mono text-slate-600">{doc.license}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {doc.status !== 'Active' ? (
                      <button
                        onClick={() => handleApproveDoctor(doc.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Approve</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        Verified Practitioner
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Patient Directory & User Management */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter patient by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <Link
                to="/admin/users"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center space-x-1"
              >
                <span>Full User Access Control View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {filteredUsers.map(user => (
                <div key={user.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 bg-sky-100 text-sky-800 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-sm">{user.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {user.role}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          user.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleToggleUserStatus(user.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                        user.status === 'Active' 
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {user.status === 'Active' ? 'Suspend Access' : 'Activate User'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Appointments Supervision */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter by patient, doctor or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <Link
                to="/admin/appointments"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center space-x-1"
              >
                <span>Full Appointment Supervision View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {filteredAppointments.map(appt => (
                <div key={appt.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{appt.patientName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-teal-700 font-semibold text-xs">{appt.doctorName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        appt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                        appt.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        appt.status === 'COMPLETED' ? 'bg-sky-100 text-sky-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                      {appt.date} at {appt.time} • <span className="text-slate-600">{appt.reason}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 self-end md:self-auto">
                    {appt.status === 'PENDING' && (
                      <button
                        onClick={() => handleOverrideAppointmentStatus(appt.id, 'CONFIRMED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition"
                      >
                        Confirm
                      </button>
                    )}
                    {appt.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleOverrideAppointmentStatus(appt.id, 'COMPLETED')}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition"
                      >
                        Mark Complete
                      </button>
                    )}
                    {appt.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleOverrideAppointmentStatus(appt.id, 'CANCELLED')}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Inventory & Supply Depot Summary */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Depleted Supply Items Requiring Reorder</h4>
                <p className="text-xs text-slate-500">Fast batch reordering for critical pharmacy and surgical assets</p>
              </div>

              <Link
                to="/admin/inventory"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1"
              >
                <span>Full Inventory Depot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inventoryItems.filter(i => i.status !== 'In Stock').map(item => (
                <div key={item.id} className="border border-amber-200 bg-amber-50/20 rounded-2xl p-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {item.sku}
                    </span>
                    <h5 className="font-extrabold text-slate-900 text-xs">{item.name}</h5>
                    <p className="text-[11px] text-red-700 font-bold">
                      Current Stock: {item.stock} {item.unit} (Threshold: {item.reorderLevel})
                    </p>
                  </div>

                  <button
                    onClick={() => handleQuickReorder(item)}
                    className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-xs flex items-center space-x-1 shrink-0"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Reorder +50</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Direct Administrative Sub-Portal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Link 
          to="/admin/doctors" 
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition space-y-2.5 group"
        >
          <div className="flex justify-between items-center">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition">
              <UserCheck className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Doctor Verification</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verify medical council licenses and approve specialist credentialing.
          </p>
        </Link>

        <Link 
          to="/admin/users" 
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition space-y-2.5 group"
        >
          <div className="flex justify-between items-center">
            <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl group-hover:bg-sky-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Patient & User Accounts</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Manage user accounts, assign roles, and handle account status.
          </p>
        </Link>

        <Link 
          to="/admin/inventory" 
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition space-y-2.5 group"
        >
          <div className="flex justify-between items-center">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition">
              <Package className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Inventory Management</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Track pharmacy stock, manage reorder levels, and log supply receipts.
          </p>
        </Link>

        <Link 
          to="/admin/audit-logs" 
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition space-y-2.5 group"
        >
          <div className="flex justify-between items-center">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Security Audit Logs</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review immutable audit records of logins, file transfers, and actions.
          </p>
        </Link>

      </div>

    </div>
  );
}
