/**
 * WorkspacePage.jsx
 *
 * FIXES applied:
 *   Issue 1:  setBoard now called unconditionally when boardData resolves,
 *             even if cards array is empty (was guarded by cards.length > 0).
 *   Issue 7:  Desktop sidebar no longer uses Tailwind hidden/lg:flex which
 *             was overridden by Sidebar's inline display:flex style.
 *             Now uses a useMediaQuery hook for reliable JS-driven visibility.
 *   Issue 14: resetBoard is now only triggered on workspaceId change, not on
 *             every token change — prevents flicker when token updates.
 */
import { useEffect, useState, useCallback } from 'react';
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

// ─── Responsive hook ───────────────────────────────────────────────────────────
// FIX Issue 7: replaces Tailwind hidden/lg:flex which doesn't work
// when Sidebar has inline style display:flex.
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

  // FIX Issue 14: resetBoard only on workspace change, not on token change
  useEffect(() => {
    resetBoard();
  }, [workspaceId]); // intentionally excludes resetBoard (stable Zustand action)

  // Socket init stays tied to token (correct — must re-init when auth changes)
  useEffect(() => {
    if (token) initSocket(token);
  }, [token]);

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  // Cleanup on unmount
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

  // ─── Sync API data to Zustand store ───────────────────────────────────────

  /**
   * FIX Issue 1: Call setBoard unconditionally once boardData resolves.
   * Previously guarded by `if (cards.length > 0)` — this caused infinite
   * loading spinner on empty workspaces because setBoard was never called.
   *
   * boardData undefined = still loading → board stays null (spinner shows)
   * boardData resolved  = always call setBoard({ cards }) regardless of length
   */
  useEffect(() => {
    if (boardData !== undefined) {
      const cards = boardData?.cards ?? [];
      setBoard({ cards });
    }
  }, [boardData]); // intentionally excludes setBoard (stable Zustand action)

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
                               to   { transform: translateX(0);    opacity: 1; } }
      `}</style>

      {/* ── Mobile sidebar overlay ─────────────────────────────────────── */}
      {!isDesktop && sidebarOpen && (
        <div style={styles.mobileOverlay}>
          <div
            style={styles.mobileBackdrop}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={styles.mobileSidebarWrapper}>
            <Sidebar workspace={workspace} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar (always rendered, JS-controlled visibility) ─── */}
      {/* FIX Issue 7: use JS boolean instead of Tailwind hidden/lg:flex */}
      {isDesktop && (
        <div style={styles.desktopSidebar}>
          <Sidebar workspace={workspace} />
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div style={styles.main}>

        {/* Top bar */}
        <div style={styles.topBar}>
          {/* Mobile: hamburger */}
          {!isDesktop && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={styles.iconBtn}
              aria-label="Open sidebar"
            >
              <Menu style={{ width: 18, height: 18 }} />
            </button>
          )}

          {/* Mobile: logo */}
          {!isDesktop && <Logo size={14} />}

          {/* Divider */}
          {!isDesktop && <div style={styles.divider} />}

          {/* Back to dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            style={styles.iconBtn}
            aria-label="Back to dashboard"
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>

          <div style={styles.divider} />

          {/* Workspace title */}
          <div style={styles.titleBlock}>
            {workspace?.icon && (
              <span style={styles.wsIcon}>{workspace.icon}</span>
            )}
            <div style={{ minWidth: 0 }}>
              <h1 style={styles.wsName}>{workspace?.name ?? '…'}</h1>
              <p style={styles.wsLabel}>TASK BOARD</p>
            </div>
          </div>

          {/* Live dot */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  errorText: {
    color:    'rgba(229,231,235,0.5)',
    fontSize: '14px',
  },
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

  // Mobile overlay
  mobileOverlay: {
    position:  'fixed',
    inset:     0,
    zIndex:    50,
    display:   'flex',
  },
  mobileBackdrop: {
    position:       'absolute',
    inset:          0,
    background:     'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
  },
  mobileSidebarWrapper: {
    position:  'relative',
    zIndex:    51,
    height:    '100%',
    flexShrink: 0,
    animation: 'slideInL 0.25s ease-out',
  },

  // Desktop sidebar shell — no display:flex here; Sidebar handles its own layout
  desktopSidebar: {
    flexShrink: 0,
    height:     '100%',
  },

  // Main
  main: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    minWidth:      0, // prevent flex item from overflowing
  },

  // Top bar
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
    background:  'none',
    border:      'none',
    cursor:      'pointer',
    color:       'rgba(229,231,235,0.45)',
    padding:     '6px',
    display:     'flex',
    alignItems:  'center',
    borderRadius: '8px',
    transition:  'all 0.2s',
    flexShrink:  0,
  },
  divider: {
    width:      '1px',
    height:     '20px',
    background: 'rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  titleBlock: {
    flex:        1,
    display:     'flex',
    alignItems:  'center',
    gap:         '10px',
    minWidth:    0,
  },
  wsIcon: {
    fontSize:  '18px',
    flexShrink: 0,
  },
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
    animation:    'pulse 2s ease-in-out infinite',
  },
  liveText: {
    fontSize:      '10px',
    color:         'rgba(229,231,235,0.4)',
    letterSpacing: '0.12em',
  },

  // Board area — fills remaining height
  boardArea: {
    flex:     1,
    overflow: 'hidden',
    display:  'flex',
  },
};
