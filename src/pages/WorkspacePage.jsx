import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Menu, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import useBoardStore from '../store/boardStore';
import { useWorkspaceSocket } from '../hooks/useSocket';
import { initSocket } from '../socket/socket';
import KanbanBoard from '../components/board/KanbanBoard';
import Sidebar from '../components/layout/Sidebar';

function DeleteConfirmModal({ workspaceName, onClose, onConfirm, isLoading }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }} />
      <div style={{
        position:'relative', width:'100%', maxWidth:'400px',
        background:'rgba(14,12,10,0.97)',
        border:'1px solid rgba(239,68,68,0.25)', borderRadius:'2px',
        boxShadow:'0 24px 80px rgba(0,0,0,0.7)',
        padding:'32px 28px',
        display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', textAlign:'center',
      }}>
        <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Trash2 style={{ width:20, height:20, color:'#ef4444' }} />
        </div>
        <div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', fontWeight:600, color:'#f0ede8', margin:'0 0 8px' }}>Delete Workspace</p>
          <p style={{ fontSize:'13px', color:'rgba(240,237,232,0.45)', lineHeight:1.7, margin:0, fontWeight:300 }}>
            Are you sure you want to delete{' '}
            <span style={{ color:'#f0ede8', fontWeight:500 }}>"{workspaceName}"</span>?{' '}
            All tasks and activity will be permanently removed. This cannot be undone.
          </p>
        </div>
        <div style={{ display:'flex', gap:'10px', width:'100%', marginTop:'8px' }}>
          <button onClick={onClose} style={{
            flex:1, padding:'11px', fontSize:'12px', letterSpacing:'0.06em',
            color:'rgba(240,237,232,0.6)', background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.1)', borderRadius:'2px',
            cursor:'pointer', fontFamily:'inherit', fontWeight:500, transition:'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color='#f0ede8'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.6)'}
          >CANCEL</button>
          <button onClick={onConfirm} disabled={isLoading} style={{
            flex:1, padding:'11px', fontSize:'12px', letterSpacing:'0.06em',
            color:'#fff', background: isLoading ? 'rgba(239,68,68,0.5)' : '#ef4444',
            border:'none', borderRadius:'2px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily:'inherit', fontWeight:600, transition:'all 0.2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
          }}>
            {isLoading
              ? <><Loader2 style={{ width:13, height:13, animation:'spin 1s linear infinite' }} /> DELETING...</>
              : <><Trash2 style={{ width:13, height:13 }} /> DELETE</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { setBoard, setActivities } = useBoardStore();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
  const activities = Array.isArray(activitiesData) ? activitiesData : (activitiesData?.activities ?? []);

  useEffect(() => { if (cards.length > 0) setBoard({ cards }); }, [cards, setBoard]);
  useEffect(() => { if (activities.length > 0) setActivities(activities); }, [activities, setActivities]);

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/workspaces/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['workspaces']);
      toast.success('Workspace deleted');
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  // ✅ owner or admin can delete
  const canDelete = workspace?.members?.some(m => {
    const mid = m.userId?._id || m.userId;
    return mid?.toString() === user?.id?.toString() && ['owner', 'admin'].includes(m.role);
  });

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

      {sidebarOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:40 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ position:'relative', zIndex:50, height:'100%' }}>
            <Sidebar workspace={workspace} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden lg:flex">
        <Sidebar workspace={workspace} />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* topbar */}
        <div style={{
          display:'flex', alignItems:'center', gap:'12px',
          padding:'14px 24px',
          borderBottom:'1px solid rgba(232,162,74,0.1)',
          background:'rgba(11,11,12,0.8)', backdropFilter:'blur(10px)',
        }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"
            style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(240,237,232,0.4)', padding:'4px', display:'flex', alignItems:'center', transition:'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color='#f0ede8'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.4)'}
          ><Menu style={{ width:18, height:18 }} /></button>

          <button onClick={() => navigate('/dashboard')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(240,237,232,0.4)', padding:'4px', display:'flex', alignItems:'center', transition:'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color='#e8a24a'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.4)'}
          ><ArrowLeft style={{ width:16, height:16 }} /></button>

          <div style={{ width:'1px', height:'20px', background:'rgba(255,255,255,0.08)' }} />

          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'15px', fontWeight:500, color:'#f0ede8', margin:0, letterSpacing:'0.02em' }}>{workspace?.name}</h1>
            <p style={{ fontSize:'11px', color:'rgba(240,237,232,0.35)', margin:0, letterSpacing:'0.08em' }}>TASK BOARD</p>
          </div>

          {/* workspace color dot */}
          {workspace?.color && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: workspace.color, boxShadow:`0 0 8px ${workspace.color}60` }} />
              <span style={{ fontSize:'11px', color:'rgba(240,237,232,0.3)', letterSpacing:'0.08em' }}>LIVE</span>
            </div>
          )}

          {/* ✅ Delete button — owner/admin only */}
          {canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                display:'flex', alignItems:'center', gap:'6px',
                padding:'7px 14px', fontSize:'11px', letterSpacing:'0.06em',
                color:'rgba(240,237,232,0.35)', background:'transparent',
                border:'1px solid transparent', borderRadius:'2px',
                cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.borderColor='rgba(239,68,68,0.3)'; e.currentTarget.style.background='rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(240,237,232,0.35)'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='transparent'; }}
            >
              <Trash2 style={{ width:13, height:13 }} />
              <span className="hidden sm:block">DELETE</span>
            </button>
          )}
        </div>

        <div style={{ flex:1, overflow:'hidden', display:'flex' }}>
          <KanbanBoard workspaceId={id} members={workspace?.members || []} />
        </div>
      </div>

      {showDeleteModal && (
        <DeleteConfirmModal
          workspaceName={workspace?.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => deleteMutation.mutate()}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}