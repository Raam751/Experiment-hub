import { useState } from 'react';
import './index.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExperimentPage from './pages/ExperimentPage';
import { isLoggedIn, clearToken } from './api';

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [user, setUser] = useState(null);
  const [selectedExperiment, setSelectedExperiment] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    setUser(null);
    setSelectedExperiment(null);
  };

  if (!loggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <>
      <nav className="navbar">
        <span className="navbar-brand">⚡ ExperimentHub</span>
        <div className="navbar-actions">
          {user && <span className="navbar-user">{user.email} ({user.role})</span>}
          <button id="logout-btn" className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {selectedExperiment ? (
        <ExperimentPage
          experimentId={selectedExperiment}
          onBack={() => setSelectedExperiment(null)}
        />
      ) : (
        <DashboardPage onSelectExperiment={setSelectedExperiment} />
      )}
    </>
  );
}

export default App;
