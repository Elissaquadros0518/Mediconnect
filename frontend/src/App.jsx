import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Pages - Public
import Landing from './pages/public/Landing';
import DoctorDirectory from './pages/public/DoctorDirectory';
import DoctorDetail from './pages/public/DoctorDetail';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';

// Pages - Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientRecords from './pages/patient/PatientRecords';
import BookAppointment from './pages/patient/BookAppointment';
import PatientNotifications from './pages/patient/PatientNotifications';
import PatientProfile from './pages/patient/PatientProfile';

// Pages - Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import PatientRecordView from './pages/doctor/PatientRecordView';
import VisitSummaryEditor from './pages/doctor/VisitSummaryEditor';
import ManageSlots from './pages/doctor/ManageSlots';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminUsers from './pages/admin/AdminUsers';
import AuditLogs from './pages/admin/AuditLogs';

const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar />
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/doctors" element={<Layout><DoctorDirectory /></Layout>} />
        <Route path="/doctors/:id" element={<Layout><DoctorDetail /></Layout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Patient Portals */}
        <Route path="/patient/dashboard" element={<Layout><PatientDashboard /></Layout>} />
        <Route path="/patient/records" element={<Layout><PatientRecords /></Layout>} />
        <Route path="/patient/book-appointment" element={<Layout><BookAppointment /></Layout>} />
        <Route path="/patient/notifications" element={<Layout><PatientNotifications /></Layout>} />
        <Route path="/patient/profile" element={<Layout><PatientProfile /></Layout>} />

        {/* Doctor Portals */}
        <Route path="/doctor/dashboard" element={<Layout><DoctorDashboard /></Layout>} />
        <Route path="/doctor/appointments" element={<Layout><DoctorAppointments /></Layout>} />
        <Route path="/doctor/manage-slots" element={<Layout><ManageSlots /></Layout>} />
        <Route path="/doctor/patient-record/:id" element={<Layout><PatientRecordView /></Layout>} />
        <Route path="/doctor/visit-summary" element={<Layout><VisitSummaryEditor /></Layout>} />

        {/* Admin Portals & Management Views */}
        <Route path="/admin/dashboard" element={<Layout><AdminDashboard /></Layout>} />
        <Route path="/admin/appointments" element={<Layout><AdminAppointments /></Layout>} />
        <Route path="/admin/doctors" element={<Layout><AdminDoctors /></Layout>} />
        <Route path="/admin/users" element={<Layout><AdminUsers /></Layout>} />
        <Route path="/admin/audit-logs" element={<Layout><AuditLogs /></Layout>} />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}