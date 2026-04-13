/**
 * WorkspacePage.jsx
 *
 * Layout matches reference image:
 *   - LEFT: narrow floating icon sidebar (64px) with workspace avatar + nav icons
 *   - RIGHT: top bar (workspace name, member avatars, call button, search)
 *            + kanban board
 *
 * Colors: black (#0B0F14) + amber (#F59E0B) — existing palette preserved
 * VideoCallButton + VideoCallModal wired in
 * MemberAvatars correctly extracts .userId from members array
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, LayoutDashboard, Settings,
  Bell, Search, Plus, X,
} from 'lucide-react';
import api from '../lib/api';
import useAuthStore  from '../store/authStore';
import useBoardStore from '../store/boardStore';
import { useWorkspaceSocket } from '../hooks/useSocket';
import { useVideoCall }       from '../hooks/useVideoCall';
import { initSocket }         from '../socket/socket';
import KanbanBoard     from '../components/board/KanbanBoard';
import Sidebar         from '../components/layout/Sidebar';
import VideoCallButton from '../call/VideoCallButton';
import VideoCallModal  from '../call/VideoCallModal';

// ── Responsive hook ────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ── Icon sidebar nav item ──────────────────────────────────────────────────────
function NavIcon({ icon: Icon, label, active, onClick, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        title={label}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '44px', height: '44px', borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active
            ? 'rgba(245,158,11,0.15)'
            : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
          border: active ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
          cursor: 'pointer', transition: 'all 0.18s',
          color: active ? '#F59E0B' : hovered ? 'rgba(229,231,235,0.7)' : 'rgba(229,231,235,0.3)',
        }}
      >
        <Icon style={{ width: 18, height: 18 }} />
      </button>
      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', left: '56px', top: '50%', transform: 'translateY(-50%)',
          background: '#1a2233', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', padding: '5px 10px', whiteSpace: 'nowrap',
          fontSize: '11px', color: '#E5E7EB', pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)', zIndex: 100,
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ── Member avatar cluster ──────────────────────────────────────────────────────
function MemberAvatars({ members = [], onlineUsers = [] }) {
  const onlineIds = new Set(onlineUsers.map(u => (u._id || u.id)?.toString()));

  // ✅ Extract .userId from members array (backend returns [{userId: {...}, role}])
  const resolved = members.map(m => m.userId || m).filter(Boolean);
  const online   = resolved.filter(m => onlineIds.has((m._id || m.id)?.toString()));
  const display  = online.slice(0, 5);
  const extra    = online.length - display.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
      {display.map((m, i) => (
        <div key={m._id || i} title={`${m.name} · online`} style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '2px solid #0B0F14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#0B0F14',
          background: m.color || '#F59E0B',
          marginLeft: i === 0 ? 0 : '-8px',
          zIndex: 10 - i,
          flexShrink: 0,
          boxShadow: '0 0 0 2px rgba(245,158,11,0.2)',
        }}>
          {m.name?.[0]?.toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div style={{ width:'32px',height:'32px',borderRadius:'50%',border:'2px solid #0B0F14',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:'rgba(229,231,235,0.5)',marginLeft:'-8px',flexShrink:0 }}>
          +{extra}
        </div>
      )}
      {online.length > 0 && (
        <span style={{ fontSize:'11px',color:'rgba(229,231,235,0.3)',marginLeft:'6px',fontFamily:"'DM Sans',sans-serif" }}>
          {online.length} online
        </span>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function WorkspacePage() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { setBoard, setActivities, resetBoard, onlineUsers } = useBoardStore();
  const width     = useWindowWidth();
  const isMobile  = width < 768;

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');

  const callHook = useVideoCall();

  useEffect(() => { resetBoard(); }, [workspaceId]);
  useEffect(() => { if (token) initSocket(token); }, [token]);
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

  // Flat member objects for VideoCallButton
  const flatMembers = (workspace?.members ?? []).map(m => m.userId || m).filter(Boolean);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (wsLoading || boardLoading) {
    return (
      <div style={{ minHeight:'100vh',background:'#0B0F14',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',fontFamily:"'DM Sans',sans-serif" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width:'28px',height:'28px',border:'2px solid rgba(245,158,11,0.15)',borderTop:'2px solid #F59E0B',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
        <p style={{ fontSize:'11px',letterSpacing:'0.2em',color:'rgba(229,231,235,0.3)',margin:0 }}>LOADING WORKSPACE</p>
      </div>
    );
  }

  if (wsError) {
    return (
      <div style={{ minHeight:'100vh',background:'#0B0F14',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',fontFamily:"'DM Sans',sans-serif" }}>
        <p style={{ color:'rgba(229,231,235,0.5)',fontSize:'14px',margin:0 }}>Failed to load workspace</p>
        <button onClick={() => navigate('/dashboard')} style={{ display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#F59E0B',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit' }}>
          <ArrowLeft style={{ width:14,height:14 }} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh', background: '#0B0F14',
      display: 'flex', overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif", color: '#E5E7EB',
      position: 'relative',
    }}>
      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes slideInL { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes liveGlow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.35)} 50%{box-shadow:0 0 0 5px rgba(245,158,11,0)} }
        @keyframes fadeIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot{ 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── Floating icon sidebar (reference image style) ─────────────────── */}
      {!isMobile && (
        <div style={{
          width: '72px', flexShrink: 0, height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 0',
          background: 'rgba(11,15,20,0.95)',
          borderRight: '1px solid rgba(245,158,11,0.07)',
          gap: '6px',
          zIndex: 20,
        }}>
          {/* Workspace avatar */}
          <div
            title={workspace?.name}
            style={{
              width: '44px', height: '44px', borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', flexShrink: 0,
              background: (workspace?.color || '#F59E0B') + '20',
              border: `1.5px solid ${workspace?.color || '#F59E0B'}40`,
              marginBottom: '8px',
            }}
          >
            {workspace?.icon || '🚀'}
          </div>

          {/* Divider */}
          <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '6px' }} />

          {/* Nav icons */}
          <NavIcon icon={LayoutDashboard} label="Dashboard" onClick={() => navigate('/dashboard')} />
          <NavIcon icon={Settings} label="Members & Settings" active={sidebarOpen} onClick={() => setSidebarOpen(v => !v)} />
          <NavIcon icon={Bell} label="Activity" onClick={() => setSidebarOpen(true)} />

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Back to dashboard */}
          <NavIcon icon={ArrowLeft} label="Back to Dashboard" onClick={() => navigate('/dashboard')} />
        </div>
      )}

      {/* ── Members/activity sidebar (slides in from icon sidebar) ────────── */}
      {sidebarOpen && (
        <div style={{
          width: '264px', flexShrink: 0, height: '100%',
          zIndex: 15, animation: 'slideInL 0.22s ease-out',
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? '0' : 'auto',
          top: isMobile ? '0' : 'auto',
        }}>
          {isMobile && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: -1 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Sidebar workspace={workspace} onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <div style={{
          height: '60px', flexShrink: 0,
          display: 'flex', alignItems: 'center',
          padding: `0 ${isMobile ? '16px' : '24px'}`,
          gap: '12px',
          borderBottom: '1px solid rgba(245,158,11,0.08)',
          background: 'rgba(11,15,20,0.96)',
          backdropFilter: 'blur(14px)',
          zIndex: 10,
        }}>
          {/* Mobile: hamburger */}
          {isMobile && (
            <button onClick={() => setSidebarOpen(v => !v)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(229,231,235,0.4)',padding:'6px',display:'flex',alignItems:'center',borderRadius:'8px',flexShrink:0 }}>
              <Settings style={{ width:18,height:18 }} />
            </button>
          )}

          {/* Workspace name + icon */}
          <div style={{ display:'flex',alignItems:'center',gap:'10px',flex:1,minWidth:0 }}>
            {!isMobile && workspace?.icon && (
              <span style={{ fontSize:'18px',flexShrink:0 }}>{workspace.icon}</span>
            )}
            <div style={{ minWidth:0 }}>
              <h1 style={{ fontSize:'15px',fontWeight:600,color:'#E5E7EB',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-0.01em' }}>
                {workspace?.name ?? '…'}
              </h1>
              <p style={{ fontSize:'9px',color:'rgba(229,231,235,0.3)',margin:0,letterSpacing:'0.14em' }}>TASK BOARD</p>
            </div>
          </div>

          {/* Right cluster */}
          <div style={{ display:'flex',alignItems:'center',gap:'10px',flexShrink:0 }}>

            {/* Search */}
            {searchOpen ? (
              <div style={{ display:'flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'10px',padding:'6px 12px',animation:'fadeIn 0.15s ease-out' }}>
                <Search style={{ width:13,height:13,color:'rgba(229,231,235,0.4)',flexShrink:0 }} />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search cards…"
                  style={{ background:'none',border:'none',outline:'none',color:'#E5E7EB',fontSize:'13px',fontFamily:'inherit',width: isMobile?'100px':'160px' }}
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(229,231,235,0.3)',padding:0,display:'flex' }}>
                  <X style={{ width:13,height:13 }} />
                </button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} style={{ width:'34px',height:'34px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',cursor:'pointer',color:'rgba(229,231,235,0.4)',transition:'all 0.15s',flexShrink:0 }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#E5E7EB'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(229,231,235,0.4)'; }}
              >
                <Search style={{ width:15,height:15 }} />
              </button>
            )}

            {/* Member avatars — hide on mobile */}
            {!isMobile && (
              <MemberAvatars members={workspace?.members ?? []} onlineUsers={onlineUsers} />
            )}

            {/* Divider */}
            {!isMobile && <div style={{ width:'1px',height:'20px',background:'rgba(255,255,255,0.07)',flexShrink:0 }} />}

            {/* Call button */}
            <VideoCallButton members={flatMembers} callHook={callHook} />

            {/* Live indicator */}
            <div style={{ display:'flex',alignItems:'center',gap:'5px',flexShrink:0 }}>
              <span style={{ display:'block',width:'7px',height:'7px',borderRadius:'50%',background:'#F59E0B',animation:'liveGlow 2s ease-in-out infinite',flexShrink:0 }} />
              {!isMobile && <span style={{ fontSize:'9px',color:'rgba(229,231,235,0.35)',letterSpacing:'0.14em',fontWeight:600 }}>LIVE</span>}
            </div>
          </div>
        </div>

        {/* ── Kanban board ──────────────────────────────────────────────────── */}
        <div style={{ flex:1,overflow:'hidden',display:'flex' }}>
          <KanbanBoard workspaceId={workspaceId} members={workspace?.members ?? []} />
        </div>
      </div>

      {/* Video call modal */}
      <VideoCallModal callHook={callHook} />
    </div>
  );
}