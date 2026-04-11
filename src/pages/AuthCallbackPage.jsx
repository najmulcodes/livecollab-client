import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { initSocket } from '../socket/socket';
import api from '../lib/api';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const didRun = useRef(false); // ✅ FIX 2: prevent double-fire in StrictMode

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // ✅ FIX 3: pass token directly in header — don't rely on interceptor
    // because localStorage may not be read yet by the interceptor
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => {
        const user = data.user;
        // ✅ setAuth writes to both localStorage AND Zustand atomically
        setAuth(user, token);
        initSocket(token);
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        console.error('OAuth callback error:', err);
        navigate('/login', { replace: true });
      });
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">
        Signing you in...
      </div>
    </div>
  );
}