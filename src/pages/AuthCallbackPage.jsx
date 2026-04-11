import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { initSocket } from '../socket/socket';
import api from '../lib/api';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      navigate('/login');
      return;
    }

    // ✅ Save token immediately (prevents redirect loop)
    localStorage.setItem('lc_token', token);

    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => {
        // ✅ Important: backend returns { user: {...} }
        const user = data.user;

        // ✅ Save to Zustand + localStorage
        setAuth(user, token);

        // ✅ Init socket AFTER auth
        initSocket(token);

        // ✅ Final redirect
        navigate('/dashboard');
      })
      .catch((err) => {
        console.error('OAuth error:', err);

        // cleanup
        localStorage.removeItem('lc_token');
        localStorage.removeItem('lc_user');

        navigate('/login');
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