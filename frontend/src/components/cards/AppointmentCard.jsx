import { formatDate } from '../../utils/formatters.js';
import StatusBadge from '../common/StatusBadge.jsx';

export default function AppointmentCard({ appointment }) {
  return (
    <article className="card">
      <div className="card-heading"><h3>{appointment.doctor_name ?? 'Appointment'}</h3><StatusBadge status={appointment.status} /></div>
      <p>{formatDate(appointment.starts_at)}</p>
    </article>
  );
}
