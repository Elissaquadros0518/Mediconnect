import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import ProtectedRoute from './components/guards/ProtectedRoute';
import RoleGuard from './components/guards/RoleGuard';

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

        {/* Patient Portals (Guarded) */}
        <Route path="/patient/dashboard" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['patient', 'admin']}>
              <Layout><PatientDashboard /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/patient/records" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['patient', 'admin']}>
              <Layout><PatientRecords /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/patient/book-appointment" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['patient', 'admin']}>
              <Layout><BookAppointment /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/patient/notifications" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['patient', 'admin']}>
              <Layout><PatientNotifications /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/patient/profile" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['patient', 'admin']}>
              <Layout><PatientProfile /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* Doctor Portals (Guarded) */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['doctor', 'admin']}>
              <Layout><DoctorDashboard /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/doctor/appointments" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['doctor', 'admin']}>
              <Layout><DoctorAppointments /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/doctor/manage-slots" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['doctor', 'admin']}>
              <Layout><ManageSlots /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/doctor/patient-record/:id" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['doctor', 'admin']}>
              <Layout><PatientRecordView /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/doctor/visit-summary" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['doctor', 'admin']}>
              <Layout><VisitSummaryEditor /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* Admin Portals & Management Views (Guarded) */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <Layout><AdminDashboard /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/admin/appointments" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <Layout><AdminAppointments /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/admin/doctors" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <Layout><AdminDoctors /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <Layout><AdminUsers /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />
        <Route path="/admin/audit-logs" element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <Layout><AuditLogs /></Layout>
            </RoleGuard>
          </ProtectedRoute>
        } />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}