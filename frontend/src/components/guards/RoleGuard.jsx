import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

export default function RoleGuard({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Checking role access..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user?.role || '').toLowerCase();
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

  if (!normalizedAllowed.includes(userRole)) {
    // Redirect to the user's appropriate portal dashboard instead of a dead end
    if (userRole === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/patient/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}
