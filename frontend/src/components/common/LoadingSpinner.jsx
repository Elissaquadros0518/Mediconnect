export default function LoadingSpinner({ label = 'Loading' }) {
  return <div className="notice" role="status"><span className="spinner" />{label}…</div>;
}
