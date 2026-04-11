import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { initSocket } from '../socket/socket';
import axiosInstance from '../lib/axios';

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

    console.log('[OAuth] token present:', !!token);
    console.log('[OAuth] baseURL:', axiosInstance.defaults.baseURL);

    if (oauthError || !token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    // ✅ Call directly with token in header — bypass interceptor timing
    axiosInstance
      .get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        console.log('[OAuth] me response:', data);
        const user = data.user;
        if (!user) throw new Error('No user returned');
        setAuth(user, token);
        initSocket(token);
        setTimeout(() => navigate('/dashboard', { replace: true }), 0);
      })
      .catch((err) => {
        console.error('[OAuth] failed:', err?.response?.status, err?.response?.data);
        setError(err?.response?.data?.message || err?.message || 'Authentication failed');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      });
  }, [navigate, setAuth]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0b0b0c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <p style={{ color: '#ef4444', fontSize: '14px' }}>{error} — redirecting...</p>
        <p style={{ color: '#555', fontSize: '12px' }}>Check browser console for details</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0b0c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: '14px' }}>Signing you in...</p>
    </div>
  );
}