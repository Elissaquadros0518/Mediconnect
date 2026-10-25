import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner label="Checking session" />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
