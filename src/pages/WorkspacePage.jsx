// src/pages/WorkspacePage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Menu, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import useBoardStore from '../store/boardStore';
import { useWorkspaceSocket } from '../hooks/useSocket';
import { initSocket } from '../socket/socket';
import KanbanBoard from '../components/board/KanbanBoard';
import Sidebar from '../components/layout/Sidebar';
import Logo from '../components/ui/Logo';

export default function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { setBoard, setActivities } = useBoardStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { if (token) initSocket(token); }, [token]);
  useWorkspaceSocket(id);

  const { data: wsData, isLoading: wsLoading, error: wsError } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => api.get(`/workspaces/${id}`).then(r => r.data),
    enabled: !!id,
  });
  const workspace = wsData?.workspace ?? null;

  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ['board', id],
    queryFn: () => api.get(`/boards/${id}/cards`).then(r => r.data),
    enabled: !!id,
  });
  const cards = boardData?.cards ?? [];

  const { data: activitiesData } = useQuery({
    queryKey: ['activities', id],
    queryFn: () => api.get(`/activities/${id}`).then(r => r.data),
    enabled: !!id,
    refetchInterval: 30_000,
  });
  const activities = Array.isArray(activitiesData)
    ? activitiesData
    : (activitiesData?.activities ?? []);

  useEffect(() => { if (cards.length > 0) setBoard({ cards }); },           [cards,      setBoard]);
  useEffect(() => { if (activities.length > 0) setActivities(activities); }, [activities, setActivities]);

  if (wsLoading || boardLoading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b0b0c', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
          <Loader2 style={{ width:28, height:28, color:'#e8a24a', animation:'spin 1s linear infinite' }} />
          <span style={{ fontSize:'12px', letterSpacing:'0.15em', color:'rgba(240,237,232,0.35)' }}>LOADING WORKSPACE</span>
        </div>
      </div>
    );
  }

  if (wsError) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b0b0c', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px', fontFamily:"'DM Sans',sans-serif" }}>
        <p style={{ color:'rgba(240,237,232,0.5)', fontSize:'14px' }}>Failed to load workspace</p>
        <button onClick={() => navigate('/dashboard')} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', letterSpacing:'0.08em', color:'#e8a24a', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
          <ArrowLeft style={{ width:14, height:14 }} /> BACK TO DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div style={{ height:'100vh', background:'#0b0b0c', display:'flex', overflow:'hidden', fontFamily:"'DM Sans',sans-serif", color:'#f0ede8' }}>

      {/* mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:40 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ position:'relative', zIndex:50, height:'100%' }}>
            <Sidebar workspace={workspace} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* desktop sidebar — hidden on mobile via Tailwind */}
      <div className="hidden lg:flex">
        <Sidebar workspace={workspace} />
      </div>

      {/* main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── topbar ── */}
        <div style={{
          display:'flex', alignItems:'center', gap:'12px',
          padding:'0 24px',
          height:'56px',
          borderBottom:'1px solid rgba(232,162,74,0.1)',
          background:'rgba(11,11,12,0.8)', backdropFilter:'blur(10px)',
          flexShrink:0,
        }}>

          {/* hamburger — mobile only */}
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{
            background:'none', border:'none', cursor:'pointer',
            color:'rgba(240,237,232,0.4)', padding:'4px',
            display:'flex', alignItems:'center', transition:'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color='#f0ede8'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.4)'}
          >
            <Menu style={{ width:18, height:18 }} />
          </button>

          {/* ✅ Logo visible on mobile (desktop sees it in sidebar) */}
          <div className="lg:hidden">
            <Logo size={15} />
          </div>

          <div style={{ width:'1px', height:'20px', background:'rgba(255,255,255,0.08)' }} className="lg:hidden" />

          {/* back to dashboard */}
          <button onClick={() => navigate('/dashboard')} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'rgba(240,237,232,0.4)', padding:'4px',
            display:'flex', alignItems:'center', transition:'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color='#e8a24a'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.4)'}
          >
            <ArrowLeft style={{ width:16, height:16 }} />
          </button>

          <div style={{ width:'1px', height:'20px', background:'rgba(255,255,255,0.08)' }} />

          {/* workspace title */}
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ fontSize:'15px', fontWeight:500, color:'#f0ede8', margin:0, letterSpacing:'0.02em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {workspace?.name}
            </h1>
            <p style={{ fontSize:'11px', color:'rgba(240,237,232,0.35)', margin:0, letterSpacing:'0.08em' }}>TASK BOARD</p>
          </div>

          {/* live dot */}
          {workspace?.color && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: workspace.color, boxShadow:`0 0 8px ${workspace.color}60` }} />
              <span style={{ fontSize:'11px', color:'rgba(240,237,232,0.3)', letterSpacing:'0.08em' }}>LIVE</span>
            </div>
          )}
        </div>

        {/* kanban board */}
        <div style={{ flex:1, overflow:'hidden', display:'flex' }}>
          <KanbanBoard workspaceId={id} members={workspace?.members || []} />
        </div>
      </div>
    </div>
  );
}
