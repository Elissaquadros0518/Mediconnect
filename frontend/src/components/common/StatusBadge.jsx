export default function StatusBadge({ status = 'unknown' }) {
  const label = String(status).replaceAll('_', ' ');
  return <span className={`badge badge-${String(status).toLowerCase()}`}>{label}</span>;
}
