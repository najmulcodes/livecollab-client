/**
 * Navbar.jsx — Shared navigation bar
 *
 * Used by: LandingPage, DashboardPage (and any future pages).
 * Reads auth state synchronously from Zustand (localStorage-backed) so
 * there is ZERO flicker on refresh — the correct nav renders on first paint.
 *
 * Before login  → Home | Create Workspace | Sign In
 * After login   → Home | Dashboard | Sign Out
 *
 * Props:
 *   activePath  {string}  — current path, e.g. '/dashboard'
 *   position    {'fixed'|'sticky'|'relative'}  — default 'sticky'
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Home, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { disconnectSocket } from '../../socket/socket';
import Logo from './Logo';

export default function Navbar({ position = 'sticky' }) {
  const { user, token, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoggedIn    = !!(user && token);
  const currentPath   = location.pathname;

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  // ─── Nav items ─────────────────────────────────────────────────────────────

  const guestItems = [
    { label: 'Home',             href: '/',          type: 'link'   },
    { label: 'Create Workspace', href: '/register',  type: 'ghost'  },
    { label: 'Sign In',          href: '/login',     type: 'amber'  },
  ];

  const authItems = [
    { label: 'Home',       href: '/',           type: 'link'    },
    { label: 'Dashboard',  href: '/dashboard',  type: 'link'    },
    { label: 'Sign Out',   action: handleLogout, type: 'danger' },
  ];

  const items = isLoggedIn ? authItems : guestItems;

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const isActive = (href) => href && currentPath === href;

  const renderItem = (item, mobile = false) => {
    const active = isActive(item.href);
    const baseStyle = mobile ? mobileItemBase : itemBase;

    if (item.type === 'link') {
      return (
        <button
          key={item.label}
          onClick={() => { item.href && navigate(item.href); setMobileOpen(false); }}
          style={{
            ...baseStyle,
            color:          active ? '#F59E0B' : 'rgba(229,231,235,0.6)',
            fontWeight:     active ? 600 : 400,
            borderBottom:   active && !mobile ? '2px solid #F59E0B' : '2px solid transparent',
            paddingBottom:  active && !mobile ? '2px' : '4px',
            background:     active && mobile ? 'rgba(245,158,11,0.07)' : 'transparent',
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#E5E7EB'; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(229,231,235,0.6)'; }}
        >
          {item.label}
        </button>
      );
    }

    if (item.type === 'ghost') {
      return (
        <button
          key={item.label}
          onClick={() => { item.href && navigate(item.href); setMobileOpen(false); }}
          style={{
            ...baseStyle,
            border:        '1px solid rgba(255,255,255,0.12)',
            borderRadius:  '8px',
            padding:       mobile ? '10px 16px' : '7px 16px',
            color:         'rgba(229,231,235,0.7)',
            background:    'transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#E5E7EB'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(229,231,235,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
        >
          {item.label}
        </button>
      );
    }

    if (item.type === 'amber') {
      return (
        <button
          key={item.label}
          onClick={() => { item.href && navigate(item.href); setMobileOpen(false); }}
          style={{
            ...baseStyle,
            background:   '#F59E0B',
            color:        '#0B0F14',
            fontWeight:   700,
            borderRadius: '8px',
            padding:      mobile ? '10px 20px' : '8px 20px',
            boxShadow:    '0 4px 16px rgba(245,158,11,0.3)',
            border:       'none',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,0.45)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,0.3)'}
        >
          {item.label}
        </button>
      );
    }

    if (item.type === 'danger') {
      return (
        <button
          key={item.label}
          onClick={() => { item.action?.(); setMobileOpen(false); }}
          style={{
            ...baseStyle,
            color:        'rgba(229,231,235,0.45)',
            background:   'transparent',
            border:       'none',
            display:      'flex',
            alignItems:   'center',
            gap:          '5px',
            padding:      mobile ? '10px 16px' : '6px 10px',
            borderRadius: '8px',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(229,231,235,0.45)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut style={{ width: 13, height: 13 }} />
          {item.label}
        </button>
      );
    }

    return null;
  };

  // ─── User chip (shown when logged in on desktop) ────────────────────────────

  const UserChip = () => isLoggedIn ? (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        '8px',
      padding:    '4px 10px 4px 4px',
      background: 'rgba(255,255,255,0.04)',
      border:     '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      marginRight: '4px',
    }}>
      <div style={{
        width:          '26px',
        height:         '26px',
        borderRadius:   '50%',
        background:     user?.color || '#F59E0B',
        border:         '1.5px solid rgba(245,158,11,0.3)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '11px',
        fontWeight:     700,
        color:          '#0B0F14',
        flexShrink:     0,
      }}>
        {user?.name?.[0]?.toUpperCase()}
      </div>
      <span style={{
        fontSize:   '13px',
        color:      'rgba(229,231,235,0.75)',
        fontWeight: 500,
        maxWidth:   '100px',
        overflow:   'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {user?.name?.split(' ')[0]}
      </span>
    </div>
  ) : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <header style={{
        position:       position,
        top:            0,
        left:           0,
        right:          0,
        zIndex:         100,
        height:         '60px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 clamp(16px, 4vw, 48px)',
        background:     'rgba(11,15,20,0.95)',
        borderBottom:   '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        fontFamily:     "'DM Sans', sans-serif",
      }}>
        {/* Left: Logo */}
        <Logo size={18} />

        {/* Center/Right: Desktop nav items */}
        <nav style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '4px',
        }} aria-label="Main navigation">

          {/* Hide items on mobile, show hamburger instead */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
               className="nav-desktop-items">
            {isLoggedIn && <UserChip />}
            {items.map(item => renderItem(item, false))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="nav-mobile-btn"
            style={{
              display:      'none', // shown via CSS below
              background:   'none',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              cursor:       'pointer',
              padding:      '7px',
              color:        'rgba(229,231,235,0.6)',
              alignItems:   'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle menu"
          >
            {mobileOpen
              ? <X    style={{ width: 18, height: 18 }} />
              : <Menu style={{ width: 18, height: 18 }} />
            }
          </button>
        </nav>
      </header>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div style={{
          position:       'fixed',
          top:            '60px',
          left:           0,
          right:          0,
          zIndex:         99,
          background:     '#0D1117',
          borderBottom:   '1px solid rgba(255,255,255,0.07)',
          padding:        '12px 16px 20px',
          display:        'flex',
          flexDirection:  'column',
          gap:            '6px',
          fontFamily:     "'DM Sans', sans-serif",
          boxShadow:      '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {isLoggedIn && (
            <div style={{
              display:       'flex',
              alignItems:    'center',
              gap:           '10px',
              padding:       '12px 16px',
              marginBottom:  '8px',
              background:    'rgba(255,255,255,0.03)',
              borderRadius:  '10px',
              border:        '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ width:'32px',height:'32px',borderRadius:'50%',background: user?.color||'#F59E0B',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#0B0F14',flexShrink:0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize:'13px',fontWeight:600,color:'#E5E7EB',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.name}</p>
                <p style={{ fontSize:'11px',color:'rgba(229,231,235,0.35)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.email}</p>
              </div>
            </div>
          )}
          {items.map(item => renderItem(item, true))}
        </div>
      )}

      {/* Backdrop for mobile menu */}
      {mobileOpen && (
        <div
          style={{ position:'fixed',inset:0,zIndex:98,top:'60px' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Responsive CSS — injected as a style tag */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop-items { display: none !important; }
          .nav-mobile-btn    { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile-btn    { display: none !important; }
          .nav-desktop-items { display: flex !important; }
        }
      `}</style>
    </>
  );
}

// ─── Base styles ──────────────────────────────────────────────────────────────

const itemBase = {
  fontSize:      '13px',
  fontWeight:    400,
  letterSpacing: '0.03em',
  background:    'none',
  border:        'none',
  cursor:        'pointer',
  fontFamily:    'inherit',
  padding:       '6px 10px',
  borderRadius:  '8px',
  transition:    'all 0.2s',
  whiteSpace:    'nowrap',
  textDecoration:'none',
  display:       'inline-flex',
  alignItems:    'center',
  gap:           '5px',
};

const mobileItemBase = {
  ...itemBase,
  fontSize:   '14px',
  padding:    '10px 16px',
  width:      '100%',
  textAlign:  'left',
  borderRadius: '10px',
  justifyContent: 'flex-start',
};
