import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function RoleGuard({ allowedRoles }) {
  const { user } = useAuth();
  return allowedRoles.includes(user?.role)
    ? <Outlet />
    : <Navigate to="/unauthorized" replace />;
}
