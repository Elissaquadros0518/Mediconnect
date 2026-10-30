import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters.js';

export default function DoctorCard({ doctor }) {
  return (
    <article className="card">
      <p className="eyebrow">{doctor.specialty}</p>
      <h2>{doctor.full_name}</h2>
      <p>{doctor.bio || 'Profile details coming soon.'}</p>
      {doctor.consultation_fee != null && <p>{formatCurrency(doctor.consultation_fee)}</p>}
      <Link to={`/doctors/${doctor.id}`}>View profile</Link>
    </article>
  );
}
