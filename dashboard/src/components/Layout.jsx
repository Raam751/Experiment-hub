import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clearToken } from '../api';
import { useUser } from '../contexts/UserContext';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();

  const handleLogout = () => {
    clearToken();
    navigate('/login', { replace: true });
  };

  const navLinks = [
    { path: '/', label: 'Experiments' },
    { path: '/integration', label: 'Integration' },
    { path: '/architecture', label: 'Architecture' },
  ];

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            ExperimentHub
          </span>
          <div className="navbar-links">
            {navLinks.map(link => (
              <button key={link.path}
                className={`navbar-link${location.pathname === link.path ? ' active' : ''}`}
                onClick={() => navigate(link.path)}>
                {link.label}
              </button>
            ))}
          </div>
        </div>
        <div className="navbar-actions">
          {user && (
            <span className="navbar-user">
              {user.email}
              <span className={`navbar-role-badge role-${user.role}`}>{user.role}</span>
            </span>
          )}
          <button id="logout-btn" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <Outlet />
    </>
  );
}
