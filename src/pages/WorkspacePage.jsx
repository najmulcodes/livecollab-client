/**
 * WorkspacePage.jsx
 *
 * FIXES applied (board system):
 *   Issue 1:  setBoard called unconditionally once boardData resolves
 *   Issue 7:  useIsDesktop hook replaces broken Tailwind hidden/lg:flex
 *   Issue 14: resetBoard only on workspaceId change, not token change
 *
 * ADDED: 1-to-1 WebRTC video call system
 *   - useVideoCall hook manages all WebRTC state
 *   - VideoCallButton in top bar triggers call
 *   - VideoCallModal renders call overlay
 *   - Global @keyframes vcPulse injected here for the modal's pulse ring
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Menu } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import useBoardStore from '../store/boardStore';
import { useWorkspaceSocket } from '../hooks/useSocket';
import { initSocket } from '../socket/socket';
import KanbanBoard from '../components/board/KanbanBoard';
import Sidebar from '../components/layout/Sidebar';
import Logo from '../components/ui/Logo';
import { useVideoCall } from '../hooks/useVideoCall';
import VideoCallModal from '../components/call/VideoCallModal';
import VideoCallButton from '../components/call/VideoCallButton';

// ─── Responsive hook ───────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { id: workspaceId } = useParams();
  const navigate      = useNavigate();
  const { token }     = useAuthStore();
  const { setBoard, setActivities, resetBoard } = useBoardStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop     = useIsDesktop();

  // ── Video call ──────────────────────────────────────────────────────────────
  const callHook = useVideoCall();

  // ── Board setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    resetBoard();
  }, [workspaceId]);

  useEffect(() => {
    if (token) initSocket(token);
  }, [token]);

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  useEffect(() => () => resetBoard(), []);

  useWorkspaceSocket(workspaceId);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const {
    data: wsData,
    isLoading: wsLoading,
    error: wsError,
  } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId,
  });
  const workspace = wsData?.workspace ?? null;

  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ['board', workspaceId],
    queryFn: () => api.get(`/boards/${workspaceId}/cards`).then(r => r.data),
    enabled: !!workspaceId,
    staleTime: 0,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['activities', workspaceId],
    queryFn: () => api.get(`/activities/${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  });

  // ─── Sync to store ───────────────────────────────────────────────────────

  useEffect(() => {
    if (boardData !== undefined) {
      const cards = boardData?.cards ?? [];
      setBoard({ cards });
    }
  }, [boardData]);

  useEffect(() => {
    if (activitiesData !== undefined) {
      const activities = Array.isArray(activitiesData)
        ? activitiesData
        : (activitiesData?.activities ?? []);
      setActivities(activities);
    }
  }, [activitiesData]);

  // ─── Loading / error states ────────────────────────────────────────────────

  if (wsLoading || boardLoading) {
    return (
      <div style={styles.loadingRoot}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>LOADING WORKSPACE</span>
      </div>
    );
  }

  if (wsError) {
    return (
      <div style={styles.errorRoot}>
        <p style={styles.errorText}>Failed to load workspace.</p>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Dashboard
        </button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes slideInL  { from { transform: translateX(-100%); opacity: 0; }
                               to   { transform: translateX(0); opacity: 1; } }
        @keyframes vcPulse   {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.25); }
          50%       { box-shadow: 0 0 0 14px rgba(245,158,11,0); }
        }
      `}</style>

      {/* ── Video call overlay (renders on top of everything) ─────────── */}
      <VideoCallModal callHook={callHook} />

      {/* ── Mobile sidebar overlay ─────────────────────────────────────── */}
      {!isDesktop && sidebarOpen && (
        <div style={styles.mobileOverlay}>
          <div style={styles.mobileBackdrop} onClick={() => setSidebarOpen(false)} />
          <div style={styles.mobileSidebarWrapper}>
            <Sidebar workspace={workspace} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      {isDesktop && (
        <div style={styles.desktopSidebar}>
          <Sidebar workspace={workspace} />
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div style={styles.main}>

        {/* Top bar */}
        <div style={styles.topBar}>
          {!isDesktop && (
            <button onClick={() => setSidebarOpen(true)} style={styles.iconBtn} aria-label="Open sidebar">
              <Menu style={{ width: 18, height: 18 }} />
            </button>
          )}
          {!isDesktop && <Logo size={14} />}
          {!isDesktop && <div style={styles.divider} />}

          <button onClick={() => navigate('/dashboard')} style={styles.iconBtn} aria-label="Back to dashboard">
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>
          <div style={styles.divider} />

          <div style={styles.titleBlock}>
            {workspace?.icon && <span style={styles.wsIcon}>{workspace.icon}</span>}
            <div style={{ minWidth: 0 }}>
              <h1 style={styles.wsName}>{workspace?.name ?? '…'}</h1>
              <p style={styles.wsLabel}>TASK BOARD</p>
            </div>
          </div>

          {/* ── Video call button ─────────────────────────────────────── */}
          <VideoCallButton
            members={workspace?.members ?? []}
            callHook={callHook}
          />

          <div style={styles.divider} />

          <div style={styles.liveDot}>
            <span style={styles.dot} />
            <span style={styles.liveText}>LIVE</span>
          </div>
        </div>

        {/* Kanban board */}
        <div style={styles.boardArea}>
          <KanbanBoard
            workspaceId={workspaceId}
            members={workspace?.members ?? []}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Styles (unchanged from original) ────────────────────────────────────────

const styles = {
  root: {
    height:     '100vh',
    background: '#0B0F14',
    display:    'flex',
    overflow:   'hidden',
    fontFamily: "'DM Sans', sans-serif",
    color:      '#E5E7EB',
  },
  loadingRoot: {
    minHeight:      '100vh',
    background:     '#0B0F14',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '16px',
    fontFamily:     "'DM Sans', sans-serif",
  },
  spinner: {
    width:        '32px',
    height:       '32px',
    border:       '2px solid rgba(245,158,11,0.2)',
    borderTop:    '2px solid #F59E0B',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize:      '11px',
    letterSpacing: '0.2em',
    color:         'rgba(229,231,235,0.4)',
  },
  errorRoot: {
    minHeight:      '100vh',
    background:     '#0B0F14',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '16px',
    fontFamily:     "'DM Sans', sans-serif",
  },
  errorText: { color: 'rgba(229,231,235,0.5)', fontSize: '14px' },
  backBtn: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
    fontSize:   '12px',
    color:      '#F59E0B',
    background: 'none',
    border:     'none',
    cursor:     'pointer',
  },
  mobileOverlay: {
    position: 'fixed',
    inset:    0,
    zIndex:   50,
    display:  'flex',
  },
  mobileBackdrop: {
    position:       'absolute',
    inset:          0,
    background:     'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
  },
  mobileSidebarWrapper: {
    position:   'relative',
    zIndex:     51,
    height:     '100%',
    flexShrink: 0,
    animation:  'slideInL 0.25s ease-out',
  },
  desktopSidebar: {
    flexShrink: 0,
    height:     '100%',
  },
  main: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    minWidth:      0,
  },
  topBar: {
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    padding:        '0 20px',
    height:         '56px',
    borderBottom:   '1px solid rgba(245,158,11,0.1)',
    background:     'rgba(11,15,20,0.92)',
    backdropFilter: 'blur(12px)',
    flexShrink:     0,
    zIndex:         10,
  },
  iconBtn: {
    background:   'none',
    border:       'none',
    cursor:       'pointer',
    color:        'rgba(229,231,235,0.45)',
    padding:      '6px',
    display:      'flex',
    alignItems:   'center',
    borderRadius: '8px',
    transition:   'all 0.2s',
    flexShrink:   0,
  },
  divider: {
    width:      '1px',
    height:     '20px',
    background: 'rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  titleBlock: {
    flex:       1,
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    minWidth:   0,
  },
  wsIcon:  { fontSize: '18px', flexShrink: 0 },
  wsName: {
    fontSize:     '15px',
    fontWeight:   600,
    color:        '#E5E7EB',
    margin:       0,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
  wsLabel: {
    fontSize:      '10px',
    color:         'rgba(229,231,235,0.35)',
    margin:        0,
    letterSpacing: '0.12em',
  },
  liveDot: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
    flexShrink: 0,
  },
  dot: {
    display:      'block',
    width:        '7px',
    height:       '7px',
    borderRadius: '50%',
    background:   '#F59E0B',
    boxShadow:    '0 0 0 3px rgba(245,158,11,0.2)',
  },
  liveText: {
    fontSize:      '10px',
    color:         'rgba(229,231,235,0.4)',
    letterSpacing: '0.12em',
  },
  boardArea: {
    flex:     1,
    overflow: 'hidden',
    display:  'flex',
  },
};
