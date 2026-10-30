export default function ErrorState({ message = 'Something went wrong.' }) {
  return <p className="notice notice-error" role="alert">{message}</p>;
}
