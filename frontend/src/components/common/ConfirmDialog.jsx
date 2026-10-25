import Button from './Button.jsx';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="dialog-actions" role="group" aria-label={title}>
      <p>{message}</p>
      <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      <Button type="button" onClick={onConfirm}>Confirm</Button>
    </div>
  );
}
