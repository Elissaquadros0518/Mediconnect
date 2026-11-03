import { Outlet } from 'react-router-dom';
import PortalHeading from './PortalHeading.jsx';

export default function DoctorLayout() {
  return (
    <section>
      <PortalHeading 
        title="Doctor Portal" 
        links={[
          ['Overview', '/doctor/dashboard'], 
          ['Patient Directory', '/doctor/patients'], 
          ['Manage Slots', '/doctor/manage-slots']
        ]} 
      />
      <Outlet />
    </section>
  );
}
