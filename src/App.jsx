// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Navbar           from './components/layout/Navbar';
import AuthCallbackPage from './pages/AuthCallbackPage';
import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import WorkspacePage    from './pages/WorkspacePage';

const Protected = ({ children }) => {
  const { token, user } = useAuthStore();
  if (token && user) return children;
  return <Navigate to="/login" replace />;
};

const Guest = ({ children }) => {
  const { token, user } = useAuthStore();
  if (token && user) return <Navigate to="/dashboard" replace />;
  return children;
};

// ✅ Pages that use the shared Navbar (landing + dashboard)
// Login/Register have their own minimal header
// WorkspacePage has its own top bar
const WithNav = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

export default function App() {
  return (
    <Routes>
      <Route path="/oauth-success" element={<AuthCallbackPage />} />
      <Route path="/"              element={<WithNav><LandingPage /></WithNav>} />
      <Route path="/login"         element={<Guest><LoginPage /></Guest>} />
      <Route path="/register"      element={<Guest><RegisterPage /></Guest>} />
      <Route path="/dashboard"     element={<Protected><WithNav><DashboardPage /></WithNav></Protected>} />
      <Route path="/workspace/:id" element={<Protected><WorkspacePage /></Protected>} />
      <Route path="*"              element={<Navigate to="/" replace />} />
    </Routes>
  );
}
