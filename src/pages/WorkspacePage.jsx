/**
 * WorkspacePage.jsx
 *
 * FIXES:
 *   - VideoCallButton + VideoCallModal wired in (replaces disabled stub)
 *   - MemberAvatars now correctly extracts .userId from members array
 *   - useVideoCall hook instantiated here and passed down
 *   - All existing layout, queries, socket logic preserved
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Menu } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import useBoardStore from '../store/boardStore';
import { useWorkspaceSocket } from '../hooks/useSocket';
import { useVideoCall } from '../hooks/useVideoCall';
import { initSocket } from '../socket/socket';
import KanbanBoard from '../components/board/KanbanBoard';
import Sidebar from '../components/layout/Sidebar';
import Logo from '../components/ui/Logo';
import VideoCallButton from '../components/call/VideoCallButton';
import VideoCallModal  from '../components/call/VideoCallModal';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

// ── Member avatar cluster ──────────────────────────────────────────────────────
function MemberAvatars({ members = [], onlineUsers = [] }) {
  const onlineIds = new Set(
    onlineUsers.map(u => (u._id || u.id || u)?.toString())
  );

  // ✅ FIX: members is [{userId: {_id, name, color}, role}] — extract .userId
  const resolvedMembers = members.map(m => m.userId || m).filter(Boolean);

  const onlineMembers = resolvedMembers.filter(m =>
    onlineIds.has((m._id || m.id)?.toString())
  );
  const displayList = onlineMembers.slice(0, 4);
  const extra = onlineMembers.length - displayList.length;

  if (onlineMembers.length === 0) return null;

  return (
    <div style={avatarCluster.root}>
      {displayList.map((m, i) => (
        <div
          key={m._id || i}
          title={`${m.name} (online)`}
          style={{
            ...avatarCluster.avatar,
            background: m.color || '#F59E0B',
            marginLeft: i === 0 ? 0 : '-7px',
            zIndex: 10 - i,
          }}
        >
          {m.name?.[0]?.toUpperCase() ?? '?'}
        </div>
      ))}
      {extra > 0 && (
        <div style={{ ...avatarCluster.avatar, background: 'rgba(255,255,255,0.08)', marginLeft: '-7px', zIndex: 0 }}>
          <span style={{ fontSize: '8px', color: 'rgba(229,231,235,0.5)' }}>+{extra}</span>
        </div>
      )}
      <span style={avatarCluster.label}>{onlineMembers.length} online</span>
    </div>
  );
}

const avatarCluster = {
  root: { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 },
  avatar: {
    width: '26px', height: '26px', borderRadius: '50%',
    border: '2px solid #0B0F14',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: 700, color: '#0B0F14', flexShrink: 0,
  },
  label: {
    fontSize: '11px', color: 'rgba(229,231,235,0.3)',
    fontFamily: "'DM Sans', sans-serif", marginLeft: '2px',
  },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { setBoard, setActivities, resetBoard, onlineUsers } = useBoardStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useIsDesktop();

  // ✅ Instantiate video call hook at page level
  const callHook = useVideoCall();

  useEffect(() => { resetBoard(); }, [workspaceId]);
  useEffect(() => { if (token) initSocket(token); }, [token]);
  useEffect(() => { if (isDesktop) setSidebarOpen(false); }, [isDesktop]);
  useEffect(() => () => resetBoard(), []);

  useWorkspaceSocket(workspaceId);

  const { data: wsData, isLoading: wsLoading, error: wsError } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn:  () => api.get(`/workspaces/${workspaceId}`).then(r => r.data),
    enabled:  !!workspaceId,
  });
  const workspace = wsData?.workspace ?? null;

  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey:  ['board', workspaceId],
    queryFn:   () => api.get(`/boards/${workspaceId}/cards`).then(r => r.data),
    enabled:   !!workspaceId,
    staleTime: 0,
  });

  const { data: activitiesData } = useQuery({
    queryKey:        ['activities', workspaceId],
    queryFn:         () => api.get(`/activities/${workspaceId}`).then(r => r.data),
    enabled:         !!workspaceId,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (boardData !== undefined) setBoard({ cards: boardData?.cards ?? [] });
  }, [boardData]);

  useEffect(() => {
    if (activitiesData !== undefined) {
      const a = Array.isArray(activitiesData) ? activitiesData : (activitiesData?.activities ?? []);
      setActivities(a);
    }
  }, [activitiesData]);

  // ✅ Extract flat member objects for VideoCallButton (needs {_id, name, color})
  const flatMembers = (workspace?.members ?? []).map(m => m.userId || m).filter(Boolean);

  if (wsLoading || boardLoading) {
    return (
      <div style={S.loadingRoot}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={S.spinner} />
        <p style={S.loadingTitle}>Loading workspace</p>
        <p style={S.loadingText}>CONNECTING TO BOARD</p>
      </div>
    );
  }

  if (wsError) {
    return (
      <div style={S.errorRoot}>
        <p style={S.errorTitle}>Couldn't load workspace</p>
        <p style={S.errorSub}>Check your connection or try again.</p>
        <button onClick={() => navigate('/dashboard')} style={S.errBack}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes slideInL { from { transform: translateX(-100%); opacity: 0; }
                              to   { transform: translateX(0);     opacity: 1; } }
        @keyframes liveGlow { 0%,100% { box-shadow: 0 0 0 0   rgba(245,158,11,0.35); }
                              50%     { box-shadow: 0 0 0 5px  rgba(245,158,11,0);    } }
        @keyframes vcPulse  { 0%,100% { box-shadow: 0 0 0 0   rgba(245,158,11,0.25); }
                              50%     { box-shadow: 0 0 0 14px rgba(245,158,11,0);    } }
        @keyframes fadeIn   { from { opacity:0; transform:translateY(8px); }
                              to   { opacity:1; transform:translateY(0); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      {/* Mobile sidebar overlay */}
      {!isDesktop && sidebarOpen && (
        <div style={S.mobileOverlay}>
          <div style={S.mobileBackdrop} onClick={() => setSidebarOpen(false)} />
          <div style={S.mobileSidebarWrapper}>
            <Sidebar workspace={workspace} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {isDesktop && <div style={S.desktopSidebar}><Sidebar workspace={workspace} /></div>}

      <div style={S.main}>
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <div style={S.topBar}>
          {!isDesktop && (
            <>
              <button onClick={() => setSidebarOpen(true)} style={S.iconBtn} aria-label="Open sidebar">
                <Menu style={{ width: 18, height: 18 }} />
              </button>
              <Logo size={14} />
              <div style={S.divider} />
            </>
          )}

          <button onClick={() => navigate('/dashboard')} style={S.backNavBtn} aria-label="Dashboard">
            <ArrowLeft style={{ width: 14, height: 14 }} />
            {isDesktop && <span style={S.backNavLabel}>Dashboard</span>}
          </button>

          <div style={S.divider} />

          <div style={S.titleBlock}>
            {workspace?.icon && <span style={S.wsIcon}>{workspace.icon}</span>}
            <div style={{ minWidth: 0 }}>
              <h1 style={S.wsName}>{workspace?.name ?? '…'}</h1>
              <p style={S.wsLabel}>TASK BOARD</p>
            </div>
          </div>

          {/* Right cluster: online members + call button + live */}
          <div style={S.rightCluster}>
            <MemberAvatars members={workspace?.members ?? []} onlineUsers={onlineUsers} />
            {onlineUsers.length > 0 && <div style={S.divider} />}

            {/* ✅ FIX: Real VideoCallButton wired up */}
            <VideoCallButton members={flatMembers} callHook={callHook} />

            <div style={S.divider} />
            <div style={S.livePill}>
              <span style={S.liveDot} />
              <span style={S.liveText}>LIVE</span>
            </div>
          </div>
        </div>

        {/* Kanban board */}
        <div style={S.boardArea}>
          <KanbanBoard workspaceId={workspaceId} members={workspace?.members ?? []} />
        </div>
      </div>

      {/* ✅ FIX: VideoCallModal rendered at page level */}
      <VideoCallModal callHook={callHook} />
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const S = {
  root: {
    height: '100vh', background: '#0B0F14',
    display: 'flex', overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif", color: '#E5E7EB',
  },
  loadingRoot: {
    minHeight: '100vh', background: '#0B0F14',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '8px', fontFamily: "'DM Sans', sans-serif",
  },
  spinner: {
    width: '28px', height: '28px',
    border: '2px solid rgba(245,158,11,0.15)',
    borderTop: '2px solid #F59E0B',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '8px',
  },
  loadingTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: '16px',
    fontWeight: 600, color: 'rgba(229,231,235,0.6)', margin: 0,
  },
  loadingText: {
    fontSize: '10px', letterSpacing: '0.2em',
    color: 'rgba(229,231,235,0.25)', margin: 0,
  },
  errorRoot: {
    minHeight: '100vh', background: '#0B0F14',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '10px', fontFamily: "'DM Sans', sans-serif",
  },
  errorTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: '18px',
    fontWeight: 700, color: 'rgba(229,231,235,0.7)', margin: 0,
  },
  errorSub: { fontSize: '13px', color: 'rgba(229,231,235,0.35)', margin: 0 },
  errBack: {
    display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px',
    fontSize: '13px', color: '#F59E0B', background: 'none',
    border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
  mobileOverlay: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex' },
  mobileBackdrop: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
  },
  mobileSidebarWrapper: {
    position: 'relative', zIndex: 51, height: '100%',
    flexShrink: 0, animation: 'slideInL 0.25s ease-out',
  },
  desktopSidebar: { flexShrink: 0, height: '100%' },
  main: {
    flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden', minWidth: 0,
  },
  topBar: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '0 20px', height: '58px',
    borderBottom: '1px solid rgba(245,158,11,0.09)',
    background: 'rgba(11,15,20,0.94)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    flexShrink: 0, zIndex: 10,
  },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(229,231,235,0.45)', padding: '6px',
    display: 'flex', alignItems: 'center',
    borderRadius: '8px', transition: 'all 0.15s', flexShrink: 0,
  },
  backNavBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(229,231,235,0.4)', padding: '5px 8px',
    borderRadius: '7px', transition: 'all 0.15s', flexShrink: 0,
  },
  backNavLabel: {
    fontSize: '12px', fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.01em',
  },
  divider: {
    width: '1px', height: '18px',
    background: 'rgba(255,255,255,0.07)', flexShrink: 0,
  },
  titleBlock: {
    flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0,
  },
  wsIcon: { fontSize: '18px', flexShrink: 0 },
  wsName: {
    fontSize: '14px', fontWeight: 600, color: '#E5E7EB', margin: 0,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em',
  },
  wsLabel: {
    fontSize: '9px', color: 'rgba(229,231,235,0.3)', margin: 0,
    letterSpacing: '0.14em', fontFamily: "'DM Sans', sans-serif",
  },
  rightCluster: {
    display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
  },
  livePill: { display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 },
  liveDot: {
    display: 'block', width: '7px', height: '7px',
    borderRadius: '50%', background: '#F59E0B',
    animation: 'liveGlow 2s ease-in-out infinite',
    flexShrink: 0,
  },
  liveText: {
    fontSize: '9px', color: 'rgba(229,231,235,0.38)',
    letterSpacing: '0.14em', fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
  },
  boardArea: { flex: 1, overflow: 'hidden', display: 'flex' },
};
