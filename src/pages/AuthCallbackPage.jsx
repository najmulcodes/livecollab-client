import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { initSocket } from '../socket/socket';
import api from '../lib/api';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const didRun = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const oauthError = params.get('error');

    if (oauthError || !token) {
      console.error('OAuth error param:', oauthError);
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    api
      .get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        const user = data.user;
        if (!user) throw new Error('No user in response');

        // write to localStorage + Zustand synchronously
        setAuth(user, token);
        initSocket(token);

        // Small tick to let Zustand propagate before Protected route checks
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 0);
      })
      .catch((err) => {
        console.error('OAuth /auth/me failed:', err?.response?.data || err.message);
        setError(err?.response?.data?.message || 'Authentication failed');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      });
  }, [navigate, setAuth]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center">
        <div className="text-red-400 text-sm">{error} — redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Signing you in...</div>
    </div>
  );
}