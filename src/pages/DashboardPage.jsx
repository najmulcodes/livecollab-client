/**
 * DashboardPage.jsx — LiveCollab workspace hub
 *
 * Layout (top → bottom):
 *   1. Greeting row + action buttons (Join / New Workspace)
 *   2. Stats strip (total workspaces, active cards, members)
 *   3. Workspace cards grid — equal sizes, hover lift, amber accent
 *
 * All data fetching is kept exactly as-is (no backend changes).
 * Only the visual structure and spacing are new.
 *
 * Props sourced from: useAuthStore (user), API calls for workspaces
 *
 * NOTE: Adjust the import paths for api and useAuthStore to match your
 * actual folder structure.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus, Hash, Users, LayoutGrid,
  ArrowRight, Loader2, Globe, Lock,
} from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

// ─── Greeting ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, icon: Icon, accentColor = '#F59E0B' }) {
  return (
    <div style={statStyles.root}>
      <div style={{ ...statStyles.iconWrap, background: accentColor + '14', border: `1px solid ${accentColor}22` }}>
        <Icon style={{ width: 15, height: 15, color: accentColor }} />
      </div>
      <div>
        <p style={statStyles.value}>{value}</p>
        <p style={statStyles.label}>{label}</p>
      </div>
    </div>
  );
}

const statStyles = {
  root: {
    display:     'flex',
    alignItems:  'center',
    gap:         '14px',
    padding:     '16px 20px',
    borderRadius: '12px',
    background:  'rgba(255,255,255,0.025)',
    border:      '1px solid rgba(255,255,255,0.06)',
    flex:        1,
    minWidth:    '140px',
    transition:  'border-color 0.2s ease',
  },
  iconWrap: {
    width:          '36px',
    height:         '36px',
    borderRadius:   '10px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  value: {
    fontSize:   '20px',
    fontWeight: 700,
    color:      '#E5E7EB',
    margin:     0,
    lineHeight: 1.2,
    fontFamily: "'Syne', sans-serif",
  },
  label: {
    fontSize:   '11px',
    color:      'rgba(229,231,235,0.4)',
    margin:     '2px 0 0',
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '0.02em',
  },
};

// ─── Workspace card ────────────────────────────────────────────────────────────
function WorkspaceCard({ workspace, onClick }) {
  const memberCount = workspace.members?.length ?? 0;
  const isPrivate   = workspace.isPrivate ?? false;

  // Pick a deterministic accent from the workspace's first member color or icon
  const accent = workspace.color || '#F59E0B';

  return (
    <div
      onClick={onClick}
      style={cardStyles.root}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
        e.currentTarget.style.transform   = 'translateY(-2px)';
        e.currentTarget.style.boxShadow   = '0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.boxShadow   = '0 2px 8px rgba(0,0,0,0.2)';
      }}
    >
      {/* Accent top strip */}
      <div style={{ ...cardStyles.accentStrip, background: accent }} />

      {/* Card body */}
      <div style={cardStyles.body}>
        {/* Icon + name row */}
        <div style={cardStyles.nameRow}>
          <div style={{ ...cardStyles.iconBox, background: accent + '15', border: `1px solid ${accent}25` }}>
            {workspace.icon
              ? <span style={{ fontSize: '16px' }}>{workspace.icon}</span>
              : <LayoutGrid style={{ width: 15, height: 15, color: accent }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={cardStyles.name}>{workspace.name}</p>
            {workspace.description && (
              <p style={cardStyles.desc}>{workspace.description}</p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div style={cardStyles.metaRow}>
          {/* Member avatars */}
          <div style={cardStyles.avatarStack}>
            {(workspace.members || []).slice(0, 4).map((m, i) => (
              <div
                key={m._id || i}
                style={{
                  ...cardStyles.avatar,
                  background: m.color || '#F59E0B',
                  marginLeft: i === 0 ? 0 : '-8px',
                  zIndex:     10 - i,
                }}
                title={m.name}
              >
                {m.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            ))}
            {memberCount > 4 && (
              <div style={{ ...cardStyles.avatar, background: 'rgba(255,255,255,0.08)', marginLeft: '-8px', zIndex: 0 }}>
                <span style={{ fontSize: '8px', color: 'rgba(229,231,235,0.5)' }}>+{memberCount - 4}</span>
              </div>
            )}
          </div>

          <div style={cardStyles.metaRight}>
            {/* Privacy badge */}
            <div style={cardStyles.badge}>
              {isPrivate
                ? <><Lock style={{ width: 9, height: 9 }} /> Private</>
                : <><Globe style={{ width: 9, height: 9 }} /> Open</>
              }
            </div>
            {/* Member count */}
            <div style={cardStyles.memberCount}>
              <Users style={{ width: 10, height: 10 }} />
              {memberCount}
            </div>
          </div>
        </div>

        {/* Open arrow */}
        <div style={cardStyles.openRow}>
          <span style={cardStyles.openLabel}>Open board</span>
          <ArrowRight style={{ width: 13, height: 13, color: 'rgba(245,158,11,0.5)' }} />
        </div>
      </div>
    </div>
  );
}

const cardStyles = {
  root: {
    borderRadius: '14px',
    background:   '#111827',
    border:       '1px solid rgba(255,255,255,0.07)',
    overflow:     'hidden',
    cursor:       'pointer',
    transition:   'all 0.18s ease',
    boxShadow:    '0 2px 8px rgba(0,0,0,0.2)',
    display:      'flex',
    flexDirection: 'column',
    position:     'relative',
  },
  accentStrip: {
    height:   '3px',
    width:    '100%',
    flexShrink: 0,
    opacity:  0.8,
  },
  body: {
    padding:       '16px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '14px',
    flex:          1,
  },
  nameRow: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '12px',
  },
  iconBox: {
    width:          '40px',
    height:         '40px',
    borderRadius:   '10px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  name: {
    fontSize:     '14px',
    fontWeight:   600,
    color:        '#E5E7EB',
    margin:       0,
    lineHeight:   1.3,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
    fontFamily:   "'DM Sans', sans-serif",
  },
  desc: {
    fontSize:     '12px',
    color:        'rgba(229,231,235,0.4)',
    margin:       '3px 0 0',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
    fontFamily:   "'DM Sans', sans-serif",
    lineHeight:   1.4,
  },
  metaRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '8px',
  },
  avatarStack: {
    display:    'flex',
    alignItems: 'center',
  },
  avatar: {
    width:          '22px',
    height:         '22px',
    borderRadius:   '50%',
    border:         '1.5px solid #111827',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '9px',
    fontWeight:     700,
    color:          '#0B0F14',
    flexShrink:     0,
  },
  metaRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
  },
  badge: {
    display:       'flex',
    alignItems:    'center',
    gap:           '4px',
    fontSize:      '10px',
    color:         'rgba(229,231,235,0.35)',
    background:    'rgba(255,255,255,0.05)',
    borderRadius:  '6px',
    padding:       '2px 7px',
    fontFamily:    "'DM Sans', sans-serif",
    letterSpacing: '0.02em',
  },
  memberCount: {
    display:    'flex',
    alignItems: 'center',
    gap:        '4px',
    fontSize:   '11px',
    color:      'rgba(229,231,235,0.4)',
    fontFamily: "'DM Sans', sans-serif",
  },
  openRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'flex-end',
    gap:            '5px',
    paddingTop:     '2px',
    borderTop:      '1px solid rgba(255,255,255,0.05)',
  },
  openLabel: {
    fontSize:   '11px',
    color:      'rgba(245,158,11,0.55)',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
  },
};

// ─── Join workspace modal (inline, minimal) ────────────────────────────────────
function JoinModal({ onClose, onJoined }) {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/workspaces/join', { inviteCode: code.trim() });
      onJoined?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.box} onClick={e => e.stopPropagation()}>
        <h3 style={modalStyles.title}>Join a workspace</h3>
        <p style={modalStyles.sub}>Enter the invite code shared by your team</p>
        <input
          autoFocus
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="Invite code..."
          style={modalStyles.input}
        />
        {error && <p style={modalStyles.error}>{error}</p>}
        <div style={modalStyles.actions}>
          <button onClick={onClose} style={modalStyles.cancel}>Cancel</button>
          <button
            onClick={handleJoin}
            disabled={loading || !code.trim()}
            style={{
              ...modalStyles.submit,
              opacity: (loading || !code.trim()) ? 0.5 : 1,
              cursor:  (loading || !code.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
            Join workspace
          </button>
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position:       'fixed',
    inset:          0,
    zIndex:         200,
    background:     'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(6px)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '24px',
  },
  box: {
    background:   '#111827',
    border:       '1px solid rgba(245,158,11,0.2)',
    borderRadius: '16px',
    padding:      '28px 32px',
    width:        '100%',
    maxWidth:     '400px',
    boxShadow:    '0 24px 64px rgba(0,0,0,0.6)',
    display:      'flex',
    flexDirection: 'column',
    gap:          '14px',
    animation:    'fadeIn 0.2s ease',
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize:   '18px',
    fontWeight: 700,
    color:      '#E5E7EB',
    margin:     0,
  },
  sub: {
    fontSize:   '13px',
    color:      'rgba(229,231,235,0.45)',
    margin:     0,
    lineHeight: 1.5,
  },
  input: {
    width:        '100%',
    background:   '#0B0F14',
    border:       '1px solid rgba(245,158,11,0.2)',
    borderRadius: '10px',
    outline:      'none',
    color:        '#E5E7EB',
    fontSize:     '14px',
    fontFamily:   "'DM Sans', sans-serif",
    padding:      '11px 14px',
    boxSizing:    'border-box',
  },
  error: {
    fontSize:   '12px',
    color:      '#ef4444',
    margin:     0,
    fontFamily: "'DM Sans', sans-serif",
  },
  actions: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'flex-end',
    gap:            '10px',
    marginTop:      '4px',
  },
  cancel: {
    padding:    '9px 18px',
    borderRadius: '9px',
    border:     '1px solid rgba(255,255,255,0.08)',
    background: 'transparent',
    color:      'rgba(229,231,235,0.55)',
    fontSize:   '13px',
    cursor:     'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  submit: {
    display:      'flex',
    alignItems:   'center',
    gap:          '7px',
    padding:      '9px 20px',
    borderRadius: '9px',
    border:       'none',
    background:   '#F59E0B',
    color:        '#0B0F14',
    fontSize:     '13px',
    fontWeight:   700,
    fontFamily:   "'DM Sans', sans-serif",
    boxShadow:    '0 0 16px rgba(245,158,11,0.25)',
  },
};

// ─── Main component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate            = useNavigate();
  const { user }            = useAuthStore();
  const [joinOpen, setJoinOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['workspaces'],
    queryFn:  () => api.get('/workspaces').then(r => r.data),
  });

  const workspaces = data?.workspaces ?? data ?? [];

  // Aggregate stats
  const totalMembers = workspaces.reduce(
    (acc, ws) => acc + (ws.members?.length ?? 0), 0
  );

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── Join workspace modal ─────────────────────────────────────── */}
      {joinOpen && (
        <JoinModal
          onClose={() => setJoinOpen(false)}
          onJoined={refetch}
        />
      )}

      <div style={styles.inner}>

        {/* ── 1. Greeting row ─────────────────────────────────────────── */}
        <div style={styles.greetingRow}>
          <div>
            <p style={styles.greetingLabel}>{getGreeting()},</p>
            <h1 style={styles.greetingName}>
              {user?.name?.split(' ')[0] ?? 'there'} 👋
            </h1>
          </div>

          <div style={styles.actionRow}>
            <button
              onClick={() => setJoinOpen(true)}
              style={styles.actionSecondary}
            >
              <Hash style={{ width: 14, height: 14 }} />
              Join workspace
            </button>
            <button
              onClick={() => navigate('/workspace/new')}
              style={styles.actionPrimary}
            >
              <Plus style={{ width: 14, height: 14 }} />
              New workspace
            </button>
          </div>
        </div>

        {/* ── 2. Stats strip ──────────────────────────────────────────── */}
        <div style={styles.statsStrip}>
          <StatCard
            value={workspaces.length}
            label="Workspaces"
            icon={LayoutGrid}
            accentColor="#F59E0B"
          />
          <StatCard
            value={totalMembers}
            label="Total members"
            icon={Users}
            accentColor="#3b82f6"
          />
          <StatCard
            value={workspaces.length > 0 ? 'Active' : 'None'}
            label="Board status"
            icon={Hash}
            accentColor="#10b981"
          />
        </div>

        {/* ── 3. Workspace grid ────────────────────────────────────────── */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your workspaces</h2>
            <span style={styles.sectionCount}>{workspaces.length}</span>
          </div>

          {isLoading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <span style={styles.loadingText}>Loading workspaces…</span>
            </div>
          ) : error ? (
            <div style={styles.errorState}>
              <p style={styles.errorText}>Failed to load workspaces.</p>
              <button onClick={refetch} style={styles.retryBtn}>Retry</button>
            </div>
          ) : workspaces.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <LayoutGrid style={{ width: 22, height: 22, color: 'rgba(245,158,11,0.4)' }} />
              </div>
              <p style={styles.emptyTitle}>No workspaces yet</p>
              <p style={styles.emptyText}>Create a workspace or join one with an invite code.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setJoinOpen(true)} style={styles.actionSecondary}>
                  <Hash style={{ width: 13, height: 13 }} /> Join workspace
                </button>
                <button onClick={() => navigate('/workspace/new')} style={styles.actionPrimary}>
                  <Plus style={{ width: 13, height: 13 }} /> New workspace
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.grid}>
              {workspaces.map(ws => (
                <WorkspaceCard
                  key={ws._id}
                  workspace={ws}
                  onClick={() => navigate(`/workspace/${ws._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page styles ──────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight:  'calc(100vh - 57px)',
    background: '#0B0F14',
    fontFamily: "'DM Sans', sans-serif",
    color:      '#E5E7EB',
  },
  inner: {
    maxWidth: '1200px',
    margin:   '0 auto',
    padding:  '40px 24px 64px',
    display:  'flex',
    flexDirection: 'column',
    gap:      '32px',
  },

  // Greeting
  greetingRow: {
    display:        'flex',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
    gap:            '16px',
    flexWrap:       'wrap',
  },
  greetingLabel: {
    fontSize:   '13px',
    color:      'rgba(229,231,235,0.4)',
    margin:     '0 0 4px',
    letterSpacing: '0.02em',
  },
  greetingName: {
    fontFamily: "'Syne', sans-serif",
    fontSize:   'clamp(24px, 4vw, 32px)',
    fontWeight: 700,
    color:      '#E5E7EB',
    margin:     0,
    letterSpacing: '-0.01em',
  },
  actionRow: {
    display: 'flex',
    gap:     '10px',
    flexWrap: 'wrap',
  },
  actionPrimary: {
    display:      'flex',
    alignItems:   'center',
    gap:          '7px',
    padding:      '9px 18px',
    borderRadius: '10px',
    border:       'none',
    background:   '#F59E0B',
    color:        '#0B0F14',
    fontSize:     '13px',
    fontWeight:   700,
    cursor:       'pointer',
    fontFamily:   "'DM Sans', sans-serif",
    boxShadow:    '0 0 16px rgba(245,158,11,0.2)',
    transition:   'all 0.15s ease',
    whiteSpace:   'nowrap',
  },
  actionSecondary: {
    display:      'flex',
    alignItems:   'center',
    gap:          '7px',
    padding:      '9px 18px',
    borderRadius: '10px',
    border:       '1px solid rgba(255,255,255,0.09)',
    background:   'rgba(255,255,255,0.03)',
    color:        'rgba(229,231,235,0.65)',
    fontSize:     '13px',
    fontWeight:   500,
    cursor:       'pointer',
    fontFamily:   "'DM Sans', sans-serif",
    transition:   'all 0.15s ease',
    whiteSpace:   'nowrap',
  },

  // Stats strip
  statsStrip: {
    display:  'flex',
    gap:      '12px',
    flexWrap: 'wrap',
  },

  // Section
  section: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '16px',
  },
  sectionHeader: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  sectionTitle: {
    fontSize:   '15px',
    fontWeight: 600,
    color:      'rgba(229,231,235,0.85)',
    margin:     0,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '0.01em',
  },
  sectionCount: {
    fontSize:      '11px',
    color:         'rgba(229,231,235,0.35)',
    background:    'rgba(255,255,255,0.06)',
    borderRadius:  '99px',
    padding:       '2px 9px',
    fontFamily:    "'DM Sans', sans-serif",
    letterSpacing: '0.04em',
  },

  // Workspace grid
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap:                 '14px',
  },

  // States
  loadingState: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '14px',
    padding:        '80px 0',
  },
  spinner: {
    width:        '28px',
    height:       '28px',
    border:       '2px solid rgba(245,158,11,0.15)',
    borderTop:    '2px solid #F59E0B',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize:   '12px',
    color:      'rgba(229,231,235,0.35)',
    letterSpacing: '0.08em',
  },
  errorState: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '12px',
    padding:        '80px 0',
  },
  errorText: {
    fontSize:   '13px',
    color:      'rgba(229,231,235,0.45)',
    margin:     0,
  },
  retryBtn: {
    padding:    '7px 16px',
    borderRadius: '8px',
    border:     '1px solid rgba(245,158,11,0.25)',
    background: 'transparent',
    color:      '#F59E0B',
    fontSize:   '12px',
    cursor:     'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  emptyState: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '12px',
    padding:        '80px 0',
    textAlign:      'center',
  },
  emptyIcon: {
    width:          '56px',
    height:         '56px',
    borderRadius:   '16px',
    background:     'rgba(245,158,11,0.07)',
    border:         '1px solid rgba(245,158,11,0.15)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize:   '15px',
    fontWeight: 600,
    color:      'rgba(229,231,235,0.7)',
    margin:     0,
    fontFamily: "'Syne', sans-serif",
  },
  emptyText: {
    fontSize:   '13px',
    color:      'rgba(229,231,235,0.35)',
    margin:     0,
    maxWidth:   '280px',
    lineHeight: 1.5,
  },
};
