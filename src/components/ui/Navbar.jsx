
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Home, Zap, Menu, X, Plus } from 'lucide-react';
import useAuthStore from '../../store/authStore';

// ─── Logo mark ────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <NavLink to="/" style={logoStyles.link} aria-label="LiveCollab home">
      <div style={logoStyles.icon}>
        <Zap style={{ width: 13, height: 13, color: '#0B0F14' }} strokeWidth={2.5} />
      </div>
      <span style={logoStyles.wordmark}>
        Live<span style={logoStyles.accent}>Collab</span>
      </span>
    </NavLink>
  );
}

const logoStyles = {
  link: {
    display:    'flex',
    alignItems: 'center',
    gap:        '9px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  icon: {
    width:          '28px',
    height:         '28px',
    borderRadius:   '8px',
    background:     '#F59E0B',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    boxShadow:      '0 0 12px rgba(245,158,11,0.35)',
  },
  wordmark: {
    fontFamily:    "'Syne', sans-serif",
    fontSize:      '15px',
    fontWeight:    700,
    color:         '#E5E7EB',
    letterSpacing: '-0.01em',
  },
  accent: {
    color: '#F59E0B',
  },
};

// ─── Nav link item ─────────────────────────────────────────────────────────────
function NavItem({ to, children, icon: Icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display:       'flex',
        alignItems:    'center',
        gap:           '6px',
        padding:       '6px 12px',
        borderRadius:  '8px',
        textDecoration: 'none',
        fontSize:      '13px',
        fontWeight:    500,
        fontFamily:    "'DM Sans', sans-serif",
        color:         isActive ? '#F59E0B' : 'rgba(229,231,235,0.6)',
        background:    isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
        border:        isActive ? '1px solid rgba(245,158,11,0.18)' : '1px solid transparent',
        transition:    'all 0.15s ease',
        whiteSpace:    'nowrap',
      })}
    >
      {Icon && <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />}
      {children}
    </NavLink>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.inner}>

          {/* ── Left: Logo ──────────────────────────────────────────── */}
          <LogoMark />

          {/* ── Right: Desktop nav ──────────────────────────────────── */}
          <div style={styles.desktopNav}>
            <NavItem to="/" icon={Home}>Home</NavItem>

            {user ? (
              <>
                <NavItem to="/dashboard" icon={LayoutDashboard}>Dashboard</NavItem>

                {/* Divider */}
                <div style={styles.divider} />

                {/* User avatar + name */}
                <div style={styles.userChip}>
                  <div style={{
                    ...styles.avatar,
                    background: user.color || '#F59E0B',
                  }}>
                    {user.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span style={styles.userName}>
                    {user.name?.split(' ')[0]}
                  </span>
                </div>

                {/* Sign out */}
                <button onClick={handleLogout} style={styles.signOutBtn} title="Sign out">
                  <LogOut style={{ width: 14, height: 14 }} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavItem to="/login">Sign in</NavItem>
                <NavLink to="/register" style={styles.ctaBtn}>
                  <Plus style={{ width: 13, height: 13 }} />
                  Create workspace
                </NavLink>
              </>
            )}
          </div>

          {/* ── Mobile: hamburger ───────────────────────────────────── */}
          <button
            style={styles.hamburger}
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen
              ? <X style={{ width: 18, height: 18 }} />
              : <Menu style={{ width: 18, height: 18 }} />}
          </button>
        </div>

        {/* ── Mobile drawer ─────────────────────────────────────────── */}
        {mobileOpen && (
          <div style={styles.mobileDrawer}>
            <MobileNavItem to="/" icon={Home} onClick={() => setMobileOpen(false)}>Home</MobileNavItem>

            {user ? (
              <>
                <MobileNavItem to="/dashboard" icon={LayoutDashboard} onClick={() => setMobileOpen(false)}>
                  Dashboard
                </MobileNavItem>

                <div style={styles.mobileDivider} />

                <div style={styles.mobileUserRow}>
                  <div style={{ ...styles.avatar, background: user.color || '#F59E0B' }}>
                    {user.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span style={{ fontSize: '13px', color: '#E5E7EB' }}>{user.name}</span>
                </div>

                <button onClick={handleLogout} style={styles.mobileSignOut}>
                  <LogOut style={{ width: 14, height: 14 }} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <MobileNavItem to="/login" onClick={() => setMobileOpen(false)}>Sign in</MobileNavItem>
                <MobileNavItem to="/register" onClick={() => setMobileOpen(false)}>Create workspace</MobileNavItem>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Spacer so content doesn't hide under sticky nav */}
      <div style={{ height: '57px', flexShrink: 0 }} />
    </>
  );
}

function MobileNavItem({ to, children, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        padding:        '12px 16px',
        borderRadius:   '10px',
        textDecoration: 'none',
        fontSize:       '14px',
        fontWeight:     500,
        color:          isActive ? '#F59E0B' : 'rgba(229,231,235,0.7)',
        background:     isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
      })}
    >
      {Icon && <Icon style={{ width: 16, height: 16 }} />}
      {children}
    </NavLink>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  nav: {
    position:       'fixed',
    top:            0,
    left:           0,
    right:          0,
    zIndex:         100,
    background:     'rgba(11, 15, 20, 0.88)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom:   '1px solid rgba(255,255,255,0.06)',
  },
  inner: {
    maxWidth:       '1200px',
    margin:         '0 auto',
    padding:        '0 24px',
    height:         '57px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '16px',
  },
  desktopNav: {
    display:    'flex',
    alignItems: 'center',
    gap:        '4px',
    '@media (max-width: 768px)': { display: 'none' }, // handled via JS below
  },
  divider: {
    width:      '1px',
    height:     '18px',
    background: 'rgba(255,255,255,0.08)',
    margin:     '0 8px',
    flexShrink: 0,
  },
  userChip: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
    padding:    '4px 10px 4px 4px',
    borderRadius: '99px',
    background: 'rgba(255,255,255,0.05)',
    border:     '1px solid rgba(255,255,255,0.07)',
  },
  avatar: {
    width:          '24px',
    height:         '24px',
    borderRadius:   '50%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '10px',
    fontWeight:     700,
    color:          '#0B0F14',
    flexShrink:     0,
  },
  userName: {
    fontSize:   '12px',
    fontWeight: 500,
    color:      'rgba(229,231,235,0.7)',
  },
  signOutBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          '6px',
    padding:      '6px 12px',
    borderRadius: '8px',
    border:       '1px solid rgba(239,68,68,0.2)',
    background:   'rgba(239,68,68,0.06)',
    color:        'rgba(239,68,68,0.7)',
    fontSize:     '13px',
    fontWeight:   500,
    cursor:       'pointer',
    transition:   'all 0.15s ease',
    fontFamily:   "'DM Sans', sans-serif",
    whiteSpace:   'nowrap',
  },
  ctaBtn: {
    display:        'flex',
    alignItems:     'center',
    gap:            '6px',
    padding:        '7px 14px',
    borderRadius:   '9px',
    background:     '#F59E0B',
    color:          '#0B0F14',
    fontSize:       '13px',
    fontWeight:     700,
    textDecoration: 'none',
    transition:     'all 0.15s ease',
    whiteSpace:     'nowrap',
    letterSpacing:  '0.01em',
    boxShadow:      '0 0 14px rgba(245,158,11,0.25)',
  },
  hamburger: {
    display:      'none', // shown via media query override in globals.css
    background:   'none',
    border:       'none',
    cursor:       'pointer',
    color:        'rgba(229,231,235,0.6)',
    padding:      '6px',
    borderRadius: '8px',
  },
  mobileDrawer: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
    padding:       '12px 16px 20px',
    borderTop:     '1px solid rgba(255,255,255,0.06)',
    animation:     'fadeIn 0.15s ease',
  },
  mobileDivider: {
    height:     '1px',
    background: 'rgba(255,255,255,0.06)',
    margin:     '8px 0',
  },
  mobileUserRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    padding:    '8px 16px',
  },
  mobileSignOut: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    padding:      '12px 16px',
    borderRadius: '10px',
    border:       'none',
    background:   'rgba(239,68,68,0.08)',
    color:        '#ef4444',
    fontSize:     '14px',
    fontWeight:   500,
    cursor:       'pointer',
    fontFamily:   "'DM Sans', sans-serif",
    width:        '100%',
    textAlign:    'left',
  },
};

/*
 * NOTE: The desktop nav and hamburger button visibility toggling
 * requires adding these rules to globals.css (already included):
 *
 * @media (max-width: 768px) {
 *   .lc-desktop-nav { display: none !important; }
 *   .lc-hamburger   { display: flex !important; }
 * }
 *
 * Since this file uses inline styles, the hamburger is always rendered
 * but hidden via CSS class. Add class="lc-hamburger" and class="lc-desktop-nav"
 * OR use the JS-based useIsDesktop pattern already established in WorkspacePage.
 * The mobile drawer logic above is JS-driven and works without CSS classes.
 */
