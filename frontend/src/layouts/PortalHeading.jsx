import { NavLink } from 'react-router-dom';

export default function PortalHeading({ title, links }) {
  return (
    <div className="portal-heading">
      <h1>{title}</h1>
      <nav aria-label={`${title} navigation`}>
        {links.map(([label, to]) => <NavLink key={to} end={to === `/${to.split('/')[1]}`} to={to}>{label}</NavLink>)}
      </nav>
    </div>
  );
}
