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
    if (!token) return navigate('/login');

    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setAuth(data, token);
        initSocket(token);
        navigate('/dashboard');
      })
      .catch(() => navigate('/login'));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Signing you in...</div>
    </div>
  );
}