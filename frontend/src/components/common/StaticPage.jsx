export default function StaticPage({ title, description }) {
  return (
    <section className="panel">
      <p className="eyebrow">Mediconnect Cloud</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <p className="notice">This workflow is part of the scaffold and is not connected to a production service.</p>
    </section>
  );
}
