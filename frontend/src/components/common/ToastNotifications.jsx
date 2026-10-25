export default function ToastNotifications({ message }) {
  return message ? <div className="toast" role="status">{message}</div> : null;
}
