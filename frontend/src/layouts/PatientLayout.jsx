import { NavLink, Outlet } from 'react-router-dom';
import PortalHeading from './PortalHeading.jsx';

export default function PatientLayout() {
  return <section><PortalHeading title="Patient portal" links={[
    ['Overview', '/patient'], ['Appointments', '/patient/appointments'], ['Book', '/patient/book'],
    ['Records', '/patient/records'], ['Notifications', '/patient/notifications'], ['Profile', '/patient/profile'],
  ]} /><Outlet /></section>;
}
