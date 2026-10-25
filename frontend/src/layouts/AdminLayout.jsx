import { Outlet } from 'react-router-dom';
import PortalHeading from './PortalHeading.jsx';

export default function AdminLayout() {
  return <section><PortalHeading title="Administration" links={[
    ['Overview', '/admin'], ['Doctors', '/admin/doctors'], ['Appointments', '/admin/appointments'],
    ['Users', '/admin/users'], ['Audit logs', '/admin/audit-logs'],
  ]} /><Outlet /></section>;
}
