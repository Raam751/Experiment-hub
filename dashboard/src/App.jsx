import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExperimentPage from './pages/ExperimentPage';
import IntegrationPage from './pages/IntegrationPage';
import ArchitecturePage from './pages/ArchitecturePage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider } from './contexts/UserContext';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <UserProvider>
                <Layout />
              </UserProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="experiments/:id" element={<ExperimentPage />} />
          <Route path="integration" element={<IntegrationPage />} />
          <Route path="architecture" element={<ArchitecturePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
