import { Outlet } from 'react-router-dom';
import PortalHeading from './PortalHeading.jsx';

export default function DoctorLayout() {
  return <section><PortalHeading title="Doctor portal" links={[
    ['Overview', '/doctor'], ['Appointments', '/doctor/appointments'], ['Availability', '/doctor/availability'],
  ]} /><Outlet /></section>;
}
