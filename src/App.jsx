import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import AuthCallbackPage from './pages/AuthCallbackPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';

// ✅ Check BOTH Zustand state AND localStorage as fallback
// This handles the case where Zustand hasn't rehydrated yet on first render
const Protected = ({ children }) => {
  const { user } = useAuthStore();
  const tokenInStorage = localStorage.getItem('lc_token');
  const userInStorage = (() => {
    try { return JSON.parse(localStorage.getItem('lc_user') || 'null'); }
    catch { return null; }
  })();

  if (user || (tokenInStorage && userInStorage)) {
    return children;
  }
  return <Navigate to="/login" replace />;
};

const Guest = ({ children }) => {
  const { user } = useAuthStore();
  const tokenInStorage = localStorage.getItem('lc_token');
  const userInStorage = (() => {
    try { return JSON.parse(localStorage.getItem('lc_user') || 'null'); }
    catch { return null; }
  })();

  if (user || (tokenInStorage && userInStorage)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/oauth-success" element={<AuthCallbackPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Guest><LoginPage /></Guest>} />
      <Route path="/register" element={<Guest><RegisterPage /></Guest>} />
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/workspace/:id" element={<Protected><WorkspacePage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}