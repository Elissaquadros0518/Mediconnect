export default function Select({ label, id, children, ...props }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} {...props}>{children}</select>
    </label>
  );
}
