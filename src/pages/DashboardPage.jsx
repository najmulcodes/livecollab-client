import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, LogOut, Hash, Users, ArrowRight, Loader2, X, FolderOpen, MoreVertical, Trash2 } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { disconnectSocket } from '../socket/socket';

const ICONS = ['🚀','💡','🎯','🔥','⚡','🛠️','📦','🌊','🎨','🧠','📊','🌿'];
const COLORS = ['#e8a24a','#b87930','#d4882a','#c8922a','#f0c070','#a06820','#8f5c1e','#e09030'];

const inputStyle = {
  width:'100%', padding:'11px 16px',
  background:'rgba(255,255,255,0.04)',
  border:'1px solid rgba(255,255,255,0.08)',
  borderRadius:'2px', outline:'none',
  color:'#f0ede8', fontSize:'14px',
  fontFamily:'inherit', transition:'border-color 0.2s',
  boxSizing:'border-box',
};
const labelStyle = {
  display:'block', fontSize:'11px', fontWeight:500,
  letterSpacing:'0.1em', color:'rgba(240,237,232,0.45)', marginBottom:'8px',
};

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' }} />
      <div style={{
        position:'relative', width:'100%', maxWidth:'440px',
        background:'rgba(14,12,10,0.97)',
        border:'1px solid rgba(232,162,74,0.2)', borderRadius:'2px',
        boxShadow:'0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,162,74,0.08)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', fontWeight:600, color:'#f0ede8', letterSpacing:'0.06em' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(240,237,232,0.35)', padding:'4px', display:'flex', alignItems:'center', transition:'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color='#f0ede8'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.35)'}
          ><X style={{ width:18, height:18 }} /></button>
        </div>
        <div style={{ padding:'24px' }}>{children}</div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ workspace, onClose, onConfirm, isLoading }) {
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
            <span style={{ color:'#f0ede8', fontWeight:500 }}>"{workspace.name}"</span>?{' '}
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

function CreateModal({ onClose }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [color, setColor] = useState('#e8a24a');
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body) => api.post('/workspaces', body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['workspaces']); toast.success('Workspace created!'); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create'),
  });
  return (
    <Modal title="New Workspace" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
        <div>
          <label style={labelStyle}>WORKSPACE NAME</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Product Sprint" maxLength={40} style={inputStyle}
            onFocus={e => e.target.style.borderColor='rgba(232,162,74,0.5)'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'} />
        </div>
        <div>
          <label style={labelStyle}>ICON</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)} style={{
                width:'40px', height:'40px', borderRadius:'2px', fontSize:'18px',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                background: icon === ic ? 'rgba(232,162,74,0.15)' : 'rgba(255,255,255,0.04)',
                border: icon === ic ? '1px solid rgba(232,162,74,0.5)' : '1px solid rgba(255,255,255,0.08)',
              }}>{ic}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>ACCENT COLOR</label>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} style={{
                width:'28px', height:'28px', borderRadius:'50%', background:c, border:'none', cursor:'pointer', transition:'all 0.15s',
                outline: color === c ? `2px solid ${c}` : '2px solid transparent', outlineOffset:'3px',
              }} />
            ))}
          </div>
        </div>
        <button onClick={() => { if (name.trim()) mutation.mutate({ name: name.trim(), icon, color }); }}
          disabled={mutation.isPending || !name.trim()}
          style={{
            width:'100%', padding:'13px 24px',
            background: (mutation.isPending || !name.trim()) ? 'rgba(232,162,74,0.4)' : '#e8a24a',
            border:'none', borderRadius:'2px', color:'#0b0b0c',
            fontSize:'13px', fontWeight:600, letterSpacing:'0.08em',
            cursor:(mutation.isPending || !name.trim()) ? 'not-allowed' : 'pointer',
            fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s',
            boxShadow: mutation.isPending ? 'none' : '0 8px 30px rgba(232,162,74,0.25)',
          }}>
          {mutation.isPending && <Loader2 style={{ width:15, height:15, animation:'spin 1s linear infinite' }} />}
          {mutation.isPending ? 'CREATING...' : 'CREATE WORKSPACE'}
        </button>
      </div>
    </Modal>
  );
}

function JoinModal({ onClose }) {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (inviteCode) => api.post(`/workspaces/join/${inviteCode}`).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['workspaces']);
      toast.success(`Joined ${data.workspace?.name || 'workspace'}!`);
      onClose();
      navigate(`/workspace/${data.workspace?._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid invite code'),
  });
  return (
    <Modal title="Join Workspace" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
        <p style={{ color:'rgba(240,237,232,0.45)', fontSize:'14px', lineHeight:1.6, fontWeight:300, margin:0 }}>Enter the invite code shared by your teammate.</p>
        <div>
          <label style={labelStyle}>INVITE CODE</label>
          <input autoFocus value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 12))}
            placeholder="XXXXXXXX" maxLength={12}
            style={{ ...inputStyle, textAlign:'center', letterSpacing:'0.25em', fontSize:'18px', fontFamily:"'DM Mono', monospace" }}
            onFocus={e => e.target.style.borderColor='rgba(232,162,74,0.5)'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'} />
        </div>
        <button onClick={() => mutation.mutate(code)} disabled={mutation.isPending || code.length < 4}
          style={{
            width:'100%', padding:'13px 24px',
            background:(mutation.isPending || code.length < 4) ? 'rgba(232,162,74,0.4)' : '#e8a24a',
            border:'none', borderRadius:'2px', color:'#0b0b0c',
            fontSize:'13px', fontWeight:600, letterSpacing:'0.08em',
            cursor:(mutation.isPending || code.length < 4) ? 'not-allowed' : 'pointer',
            fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s',
            boxShadow: mutation.isPending ? 'none' : '0 8px 30px rgba(232,162,74,0.25)',
          }}>
          {mutation.isPending && <Loader2 style={{ width:15, height:15, animation:'spin 1s linear infinite' }} />}
          {mutation.isPending ? 'JOINING...' : 'JOIN WORKSPACE'}
        </button>
      </div>
    </Modal>
  );
}

function WorkspaceCard({ ws, onClick, canDelete, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{ position:'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button onClick={onClick} style={{
        width:'100%', textAlign:'left', padding:'24px',
        background: hovered ? 'rgba(232,162,74,0.05)' : 'rgba(255,255,255,0.03)',
        border: hovered ? '1px solid rgba(232,162,74,0.25)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius:'2px', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'2px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', background: ws.color + '18', border:`1px solid ${ws.color}30` }}>
            {ws.icon}
          </div>
          <ArrowRight style={{ width:16, height:16, color: hovered ? '#e8a24a' : 'rgba(240,237,232,0.2)', transform: hovered ? 'translateX(3px)' : 'none', transition:'all 0.2s' }} />
        </div>
        <p style={{ fontSize:'15px', fontWeight:500, color:'#f0ede8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:'0 0 6px' }}>{ws.name}</p>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(240,237,232,0.35)', fontSize:'12px' }}>
          <Users style={{ width:12, height:12 }} />
          {ws.members?.length || 1} member{ws.members?.length !== 1 ? 's' : ''}
        </div>
      </button>

      {canDelete && (
        <div style={{ position:'absolute', top:'12px', right:'12px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{
              width:'28px', height:'28px', borderRadius:'2px',
              display:'flex', alignItems:'center', justifyContent:'center',
              background: menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
              border:'1px solid transparent', cursor:'pointer',
              color:'rgba(240,237,232,0.4)',
              opacity: hovered || menuOpen ? 1 : 0,
              transition:'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color='#f0ede8'; e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(240,237,232,0.4)'; e.currentTarget.style.background= menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent'; }}
          >
            <MoreVertical style={{ width:15, height:15 }} />
          </button>

          {menuOpen && (
            <>
              <div style={{ position:'fixed', inset:0, zIndex:10 }} onClick={() => setMenuOpen(false)} />
              <div style={{
                position:'absolute', right:0, top:'34px', zIndex:20,
                background:'rgba(14,12,10,0.98)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'2px', boxShadow:'0 12px 40px rgba(0,0,0,0.6)', minWidth:'150px', padding:'4px',
              }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:'8px',
                    padding:'10px 14px', fontSize:'12px', letterSpacing:'0.05em',
                    color:'#ef4444', background:'none', border:'none',
                    cursor:'pointer', fontFamily:'inherit', borderRadius:'2px', transition:'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <Trash2 style={{ width:13, height:13 }} /> DELETE
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then(r => r.data),
  });
  const workspaces = data?.workspaces ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/workspaces/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['workspaces']); toast.success('Workspace deleted'); setDeleteTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  // ✅ owner or admin can delete
  const canDeleteWorkspace = (ws) => {
    const member = ws.members?.find(m => {
      const mid = m.userId?._id || m.userId;
      return mid?.toString() === user?.id?.toString();
    });
    return member && ['owner', 'admin'].includes(member.role);
  };

  const handleLogout = () => { disconnectSocket(); logout(); navigate('/login'); };

  return (
    <div style={{ minHeight:'100vh', background:'#0b0b0c', fontFamily:"'DM Sans',sans-serif", color:'#f0ede8', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-200px', left:'-200px', width:'600px', height:'600px', background:'radial-gradient(circle, rgba(232,162,74,0.07) 0%, transparent 70%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'-200px', right:'-100px', width:'500px', height:'500px', background:'radial-gradient(circle, rgba(184,121,48,0.05) 0%, transparent 70%)', borderRadius:'50%' }} />
      </div>

      <header style={{ position:'relative', zIndex:10, borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'18px 48px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', fontWeight:600, letterSpacing:'0.12em', color:'#f0ede8', textDecoration:'none' }}>LIVECOLLAB</a>
        <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(232,162,74,0.15)', border:'1px solid rgba(232,162,74,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:600, color:'#e8a24a' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize:'13px', color:'rgba(240,237,232,0.6)' }}>{user?.name}</span>
          </div>
          <div style={{ width:'1px', height:'20px', background:'rgba(255,255,255,0.08)' }} />
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', letterSpacing:'0.06em', color:'rgba(240,237,232,0.4)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:500, transition:'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,237,232,0.4)'}
          ><LogOut style={{ width:14, height:14 }} /> SIGN OUT</button>
        </div>
      </header>

      <main style={{ position:'relative', zIndex:10, maxWidth:'1000px', margin:'0 auto', padding:'60px 48px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'48px', flexWrap:'wrap', gap:'20px' }}>
          <div>
            <span style={{ fontSize:'10px', letterSpacing:'0.3em', color:'#e8a24a', fontWeight:500, display:'block', marginBottom:'10px' }}>YOUR WORKSPACES</span>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(32px,4vw,48px)', fontWeight:300, color:'#f0ede8', lineHeight:1.1, margin:0 }}>
              {workspaces.length === 0 ? "Let's get started" : `Good to see you, ${user?.name?.split(' ')[0]}`}
            </h1>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => setModal('join')} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 20px', fontSize:'12px', fontWeight:500, letterSpacing:'0.06em', color:'rgba(240,237,232,0.6)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'2px', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color='#f0ede8'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(240,237,232,0.6)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}
            ><Hash style={{ width:13, height:13 }} /> JOIN</button>
            <button onClick={() => setModal('create')} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 20px', fontSize:'12px', fontWeight:600, letterSpacing:'0.08em', color:'#0b0b0c', background:'#e8a24a', border:'none', borderRadius:'2px', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', boxShadow:'0 4px 20px rgba(232,162,74,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 30px rgba(232,162,74,0.45)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(232,162,74,0.3)'}
            ><Plus style={{ width:13, height:13 }} /> NEW</button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px' }}>
            {[...Array(3)].map((_,i) => <div key={i} style={{ height:'130px', borderRadius:'2px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }} />)}
          </div>
        ) : workspaces.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:'16px', textAlign:'center' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'2px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FolderOpen style={{ width:28, height:28, color:'rgba(240,237,232,0.2)' }} />
            </div>
            <p style={{ fontSize:'16px', color:'rgba(240,237,232,0.7)', fontWeight:400, margin:0 }}>No workspaces yet</p>
            <p style={{ fontSize:'13px', color:'rgba(240,237,232,0.35)', maxWidth:'320px', lineHeight:1.6, margin:0, fontWeight:300 }}>Create your first workspace or join one with an invite code.</p>
            <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
              <button onClick={() => setModal('join')} style={{ padding:'10px 20px', fontSize:'12px', letterSpacing:'0.06em', color:'rgba(240,237,232,0.6)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'2px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>JOIN WITH CODE</button>
              <button onClick={() => setModal('create')} style={{ padding:'10px 20px', fontSize:'12px', letterSpacing:'0.08em', color:'#0b0b0c', background:'#e8a24a', border:'none', borderRadius:'2px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>CREATE WORKSPACE</button>
            </div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px' }}>
            {workspaces.map(ws => (
              <WorkspaceCard
                key={ws._id} ws={ws}
                onClick={() => navigate(`/workspace/${ws._id}`)}
                canDelete={canDeleteWorkspace(ws)}
                onDelete={() => setDeleteTarget(ws)}
              />
            ))}
            <button onClick={() => setModal('create')} style={{ minHeight:'130px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', background:'transparent', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:'2px', cursor:'pointer', fontFamily:'inherit', color:'rgba(240,237,232,0.25)', fontSize:'12px', letterSpacing:'0.08em', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(232,162,74,0.3)'; e.currentTarget.style.color='#e8a24a'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(240,237,232,0.25)'; }}
            ><Plus style={{ width:20, height:20 }} />NEW WORKSPACE</button>
          </div>
        )}
      </main>

      {modal === 'create' && <CreateModal onClose={() => setModal(null)} />}
      {modal === 'join'   && <JoinModal   onClose={() => setModal(null)} />}
      {deleteTarget && (
        <DeleteConfirmModal
          workspace={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}