import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function MainLayout() {
  const { user } = useAuth();
  const portal = user?.role ? `/${user.role}` : '/login';
  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/">Mediconnect<span>Cloud</span></Link>
        <nav aria-label="Main navigation">
          <Link to="/doctors">Find care</Link>
          {user ? <Link to={portal}>My portal</Link> : <Link to="/login">Sign in</Link>}
        </nav>
      </header>
      <main className="page"><Outlet /></main>
      <footer className="footer">A development starter — do not enter real patient data.</footer>
    </>
  );
}
