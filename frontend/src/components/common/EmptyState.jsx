export default function EmptyState({ title = 'Nothing here yet', children }) {
  return <section className="empty-state"><h2>{title}</h2><p>{children}</p></section>;
}
