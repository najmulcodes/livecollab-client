
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Plus, LogOut, Hash, Users, ArrowRight,
  Loader2, X, FolderOpen, MoreVertical, Trash2,
  Zap, Home,
} from 'lucide-react';
import api           from '../lib/api';
import useAuthStore  from '../store/authStore';
import { disconnectSocket } from '../socket/socket';
import Logo          from '../components/ui/Logo';

// ── Responsive hook ───────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const INPUT_STYLE = {
  width: '100%', padding: '11px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', outline: 'none',
  color: '#E5E7EB', fontSize: '14px',
  fontFamily: 'inherit', transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};
const LABEL_STYLE = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  letterSpacing: '0.1em', color: 'rgba(229,231,235,0.5)', marginBottom: '8px',
};
const ICONS  = ['🚀','💡','🎯','🔥','⚡','🛠️','📦','🌊','🎨','🧠','📊','🌿'];
const COLORS = ['#F59E0B','#D97706','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#f43f5e'];

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}>
      <div onClick={onClose} style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(8px)' }} />
      <div style={{ position:'relative',width:'100%',maxWidth:'440px',background:'#0D1117',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'16px',boxShadow:'0 24px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'20px',fontWeight:600,color:'#E5E7EB',letterSpacing:'0.05em' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(229,231,235,0.35)',padding:'5px',display:'flex',alignItems:'center',borderRadius:'8px' }}>
            <X style={{ width:18,height:18 }} />
          </button>
        </div>
        <div style={{ padding:'24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Create workspace modal ────────────────────────────────────────────────────
function CreateModal({ onClose }) {
  const [name,  setName]  = useState('');
  const [icon,  setIcon]  = useState('🚀');
  const [color, setColor] = useState('#F59E0B');
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body) => api.post('/workspaces', body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['workspaces']); toast.success('Workspace created!'); onClose(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create'),
  });
  const canCreate = !mutation.isPending && name.trim().length > 0;
  return (
    <Modal title="New Workspace" onClose={onClose}>
      <div style={{ display:'flex',flexDirection:'column',gap:'20px' }}>
        <div>
          <label style={LABEL_STYLE}>WORKSPACE NAME</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Product Sprint" maxLength={40} style={INPUT_STYLE}
            onFocus={e => e.target.style.borderColor='rgba(245,158,11,0.5)'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />
        </div>
        <div>
          <label style={LABEL_STYLE}>ICON</label>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'8px' }}>
            {ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)} style={{ width:'42px',height:'42px',borderRadius:'10px',fontSize:'20px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',background: icon===ic?'rgba(245,158,11,0.15)':'rgba(255,255,255,0.04)',border: icon===ic?'2px solid rgba(245,158,11,0.5)':'1px solid rgba(255,255,255,0.08)' }}>
                {ic}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={LABEL_STYLE}>ACCENT COLOR</label>
          <div style={{ display:'flex',gap:'10px',flexWrap:'wrap' }}>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} style={{ width:'28px',height:'28px',borderRadius:'50%',background:c,border:'none',cursor:'pointer',transition:'all 0.15s',outline: color===c?`3px solid ${c}`:'3px solid transparent',outlineOffset:'3px',transform: color===c?'scale(1.15)':'scale(1)' }} />
            ))}
          </div>
        </div>
        <button onClick={() => { if (canCreate) mutation.mutate({ name:name.trim(),icon,color }); }} disabled={!canCreate}
          style={{ width:'100%',padding:'13px',background: canCreate?'#F59E0B':'rgba(245,158,11,0.4)',border:'none',borderRadius:'10px',color:'#0B0F14',fontSize:'13px',fontWeight:700,letterSpacing:'0.08em',cursor: canCreate?'pointer':'not-allowed',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.2s',boxShadow: canCreate?'0 8px 30px rgba(245,158,11,0.25)':'none' }}>
          {mutation.isPending && <Loader2 style={{ width:15,height:15,animation:'spin 1s linear infinite' }} />}
          {mutation.isPending ? 'CREATING…' : 'CREATE WORKSPACE'}
        </button>
      </div>
    </Modal>
  );
}

// ── Join workspace modal ──────────────────────────────────────────────────────
function JoinModal({ onClose }) {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (c) => api.post(`/workspaces/join/${c}`).then(r => r.data),
    onSuccess: (d) => { qc.invalidateQueries(['workspaces']); toast.success(`Joined ${d.workspace?.name}!`); onClose(); navigate(`/workspace/${d.workspace?._id}`); },
    onError: (e) => toast.error(e.response?.data?.message || 'Invalid invite code'),
  });
  return (
    <Modal title="Join Workspace" onClose={onClose}>
      <div style={{ display:'flex',flexDirection:'column',gap:'20px' }}>
        <p style={{ color:'rgba(229,231,235,0.5)',fontSize:'14px',lineHeight:1.6,margin:0 }}>Enter the invite code shared by your teammate.</p>
        <div>
          <label style={LABEL_STYLE}>INVITE CODE</label>
          <input autoFocus value={code} onChange={e => setCode(e.target.value.slice(0,12))} placeholder="Enter code…" maxLength={12}
            style={{ ...INPUT_STYLE,textAlign:'center',letterSpacing:'0.25em',fontSize:'18px',fontFamily:"'DM Mono',monospace" }}
            onFocus={e => e.target.style.borderColor='rgba(245,158,11,0.5)'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />
        </div>
        <button onClick={() => mutation.mutate(code)} disabled={mutation.isPending||code.length<4}
          style={{ width:'100%',padding:'13px',background:(mutation.isPending||code.length<4)?'rgba(245,158,11,0.4)':'#F59E0B',border:'none',borderRadius:'10px',color:'#0B0F14',fontSize:'13px',fontWeight:700,letterSpacing:'0.08em',cursor:(mutation.isPending||code.length<4)?'not-allowed':'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.2s' }}>
          {mutation.isPending && <Loader2 style={{ width:15,height:15,animation:'spin 1s linear infinite' }} />}
          {mutation.isPending ? 'JOINING…' : 'JOIN WORKSPACE'}
        </button>
      </div>
    </Modal>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────
function DeleteConfirmModal({ workspace, onClose, onConfirm, isLoading }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}>
      <div onClick={onClose} style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(8px)' }} />
      <div style={{ position:'relative',width:'100%',maxWidth:'380px',background:'#0D1117',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'16px',boxShadow:'0 24px 80px rgba(0,0,0,0.7)',padding:'32px 28px',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px',textAlign:'center' }}>
        <div style={{ width:'52px',height:'52px',borderRadius:'50%',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <Trash2 style={{ width:22,height:22,color:'#ef4444' }} />
        </div>
        <div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:'20px',fontWeight:600,color:'#E5E7EB',margin:'0 0 8px' }}>Delete Workspace</p>
          <p style={{ fontSize:'13px',color:'rgba(229,231,235,0.5)',lineHeight:1.7,margin:0 }}>
            Delete <span style={{ color:'#E5E7EB',fontWeight:500 }}>"{workspace.name}"</span>? All tasks will be permanently removed.
          </p>
        </div>
        <div style={{ display:'flex',gap:'10px',width:'100%' }}>
          <button onClick={onClose} style={{ flex:1,padding:'11px',fontSize:'12px',letterSpacing:'0.06em',color:'rgba(229,231,235,0.6)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',cursor:'pointer',fontFamily:'inherit',fontWeight:500 }}>CANCEL</button>
          <button onClick={onConfirm} disabled={isLoading} style={{ flex:1,padding:'11px',fontSize:'12px',letterSpacing:'0.06em',color:'#fff',background: isLoading?'rgba(239,68,68,0.5)':'#ef4444',border:'none',borderRadius:'10px',cursor: isLoading?'not-allowed':'pointer',fontFamily:'inherit',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px' }}>
            {isLoading ? <><Loader2 style={{ width:13,height:13,animation:'spin 1s linear infinite' }} />DELETING…</> : 'DELETE'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ minHeight:'160px',borderRadius:'16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',padding:'20px',animation:'skeleton 1.5s ease-in-out infinite' }}>
      <div style={{ width:'44px',height:'44px',borderRadius:'10px',background:'rgba(255,255,255,0.06)',marginBottom:'16px' }} />
      <div style={{ width:'65%',height:'14px',borderRadius:'4px',background:'rgba(255,255,255,0.06)',marginBottom:'8px' }} />
      <div style={{ width:'40%',height:'11px',borderRadius:'4px',background:'rgba(255,255,255,0.04)' }} />
    </div>
  );
}

// ── Workspace card ────────────────────────────────────────────────────────────
function WorkspaceCard({ ws, onClick, canDelete, onDelete }) {
  const [hovered,  setHovered]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position:'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button onClick={onClick} style={{
        width:'100%', textAlign:'left', padding:'20px',
        background: hovered ? 'rgba(245,158,11,0.05)' : 'rgba(17,24,39,0.8)',
        border: hovered ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius:'16px', cursor:'pointer', transition:'all 0.2s',
        fontFamily:'inherit',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.15)',
        minHeight:'160px', display:'flex', flexDirection:'column', justifyContent:'space-between',
      }}>
        <div>
          {/* Icon + color dot */}
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'14px' }}>
            <div style={{ width:'48px',height:'48px',borderRadius:'12px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',background: ws.color+'18',border:`1px solid ${ws.color}30` }}>
              {ws.icon}
            </div>
            <div style={{ width:'8px',height:'8px',borderRadius:'50%',background: ws.color,boxShadow:`0 0 8px ${ws.color}70`,marginTop:'6px',flexShrink:0 }} />
          </div>

          <p style={{ fontSize:'15px',fontWeight:600,color:'#E5E7EB',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:'0 0 4px' }}>{ws.name}</p>
          {ws.description && (
            <p style={{ fontSize:'12px',color:'rgba(229,231,235,0.35)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0 }}>{ws.description}</p>
          )}
        </div>

        {/* Footer row */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'16px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'5px',color:'rgba(229,231,235,0.4)',fontSize:'12px' }}>
            <Users style={{ width:12,height:12 }} />
            {ws.members?.length ?? 1} member{ws.members?.length !== 1 ? 's' : ''}
          </div>
          <ArrowRight style={{ width:15,height:15,color: hovered?'#F59E0B':'rgba(229,231,235,0.2)',transition:'all 0.2s',transform: hovered?'translateX(3px)':'none' }} />
        </div>
      </button>

      {/* 3-dot menu */}
      {canDelete && (
        <div style={{ position:'absolute',top:'12px',right:'12px',zIndex:5 }}>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{ width:'28px',height:'28px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',background: menuOpen?'rgba(255,255,255,0.1)':'transparent',border:'none',cursor:'pointer',color:'rgba(229,231,235,0.5)',opacity: hovered||menuOpen?1:0,transition:'all 0.2s' }}>
            <MoreVertical style={{ width:14,height:14 }} />
          </button>
          {menuOpen && (
            <>
              <div style={{ position:'fixed',inset:0,zIndex:10 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position:'absolute',right:0,top:'34px',zIndex:20,background:'#0D1117',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',boxShadow:'0 12px 40px rgba(0,0,0,0.6)',minWidth:'150px',padding:'4px' }}>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  style={{ width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',fontSize:'12px',letterSpacing:'0.05em',color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',borderRadius:'8px',transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <Trash2 style={{ width:13,height:13 }} /> DELETE
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const width    = useWindowWidth();

  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const px = isMobile ? '16px' : isTablet ? '24px' : '48px';
  const gridCols = isMobile
    ? 'repeat(1, 1fr)'
    : isTablet
    ? 'repeat(2, 1fr)'
    : 'repeat(auto-fill, minmax(280px, 1fr))';

  const [modal,        setModal]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn:  () => api.get('/workspaces').then(r => r.data),
  });
  const workspaces = data?.workspaces ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/workspaces/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['workspaces']); toast.success('Workspace deleted'); setDeleteTarget(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const currentUserId = String(user?._id || user?.id || '');
  const canDeleteWorkspace = (ws) => {
    if (!currentUserId) return false;
    const member = ws.members?.find(m => String(m.userId?._id || m.userId || '') === currentUserId);
    return member && ['owner', 'admin'].includes(member.role);
  };

  const handleLogout = () => { disconnectSocket(); logout(); navigate('/login'); };
  const firstName    = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div style={{ minHeight:'100vh',background:'#0B0F14',fontFamily:"'DM Sans',sans-serif",color:'#E5E7EB',position:'relative',overflow:'hidden' }}>
      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes skeleton { 0%,100%{opacity:.4} 50%{opacity:.7} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Background glows */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0 }}>
        <div style={{ position:'absolute',top:'-150px',left:'-150px',width:'500px',height:'500px',background:'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',borderRadius:'50%' }} />
        <div style={{ position:'absolute',bottom:'-150px',right:'-100px',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',borderRadius:'50%' }} />
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{
        position:'sticky', top:0, zIndex:10,
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '12px 16px' : '14px 40px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(11,15,20,0.92)', backdropFilter:'blur(12px)',
        gap:'12px',
      }}>
        <Logo size={isMobile ? 15 : 18} />

        <div style={{ display:'flex',alignItems:'center',gap: isMobile ? '8px' : '12px' }}>
          {/* Home button — hide on mobile to save space */}
          {!isMobile && (
            <button onClick={() => navigate('/')} style={{ display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',letterSpacing:'0.06em',fontWeight:500,color:'rgba(229,231,235,0.4)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:'6px 10px',borderRadius:'8px',transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color='#E5E7EB'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(229,231,235,0.4)'; e.currentTarget.style.background='none'; }}
            ><Home style={{ width:13,height:13 }} />{!isTablet && ' HOME'}</button>
          )}

          {!isMobile && <div style={{ width:'1px',height:'18px',background:'rgba(255,255,255,0.08)' }} />}

          {/* User avatar — always visible */}
          <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
            <div style={{ width: isMobile?'28px':'32px',height: isMobile?'28px':'32px',borderRadius:'50%',background: user?.color||'rgba(245,158,11,0.2)',border:'1.5px solid rgba(245,158,11,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#F59E0B',flexShrink:0 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {/* Name hidden on mobile */}
            {!isMobile && (
              <span style={{ fontSize:'13px',color:'rgba(229,231,235,0.7)',fontWeight:500,maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                {user?.name}
              </span>
            )}
          </div>

          {!isMobile && <div style={{ width:'1px',height:'18px',background:'rgba(255,255,255,0.08)' }} />}

          {/* Sign out */}
          <button onClick={handleLogout} style={{ display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',letterSpacing:'0.06em',fontWeight:500,color:'rgba(229,231,235,0.4)',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:'6px 8px',borderRadius:'8px',transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='rgba(239,68,68,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(229,231,235,0.4)'; e.currentTarget.style.background='none'; }}
          >
            <LogOut style={{ width:14,height:14 }} />
            {!isMobile && <span style={{ letterSpacing:'0.06em' }}>SIGN OUT</span>}
          </button>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main style={{ position:'relative',zIndex:10,maxWidth:'1200px',margin:'0 auto',padding:`${isMobile?'24px':'40px'} ${px}`,animation:'fadeUp 0.3s ease-out' }}>

        {/* Page header row */}
        <div style={{ display:'flex',alignItems: isMobile?'flex-start':'flex-end',justifyContent:'space-between',marginBottom: isMobile?'24px':'36px',flexDirection: isMobile?'column':'row',gap:'16px' }}>
          <div>
            <span style={{ fontSize:'10px',letterSpacing:'0.3em',color:'#F59E0B',fontWeight:600,display:'block',marginBottom:'6px' }}>YOUR WORKSPACES</span>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize: isMobile?'28px':isTablet?'36px':'44px',fontWeight:300,color:'#E5E7EB',lineHeight:1.1,margin:0 }}>
              {workspaces.length === 0 ? "Let's get started" : `Good to see you, ${firstName}`}
            </h1>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex',gap:'10px',flexShrink:0,width: isMobile?'100%':'auto' }}>
            <button onClick={() => setModal('join')} style={{ flex: isMobile?1:0,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'10px 16px',fontSize:'12px',fontWeight:500,letterSpacing:'0.06em',color:'rgba(229,231,235,0.7)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',whiteSpace:'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.color='#E5E7EB'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(229,231,235,0.7)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}
            ><Hash style={{ width:13,height:13 }} /> JOIN</button>
            <button onClick={() => setModal('create')} style={{ flex: isMobile?1:0,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'10px 16px',fontSize:'12px',fontWeight:700,letterSpacing:'0.08em',color:'#0B0F14',background:'#F59E0B',border:'none',borderRadius:'10px',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',boxShadow:'0 4px 20px rgba(245,158,11,0.3)',whiteSpace:'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 30px rgba(245,158,11,0.45)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(245,158,11,0.3)'}
            ><Plus style={{ width:13,height:13 }} /> NEW</button>
          </div>
        </div>

        {/* Stats row — only when workspaces exist */}
        {!isLoading && workspaces.length > 0 && (
          <div style={{ display:'grid',gridTemplateColumns: isMobile?'repeat(1,1fr)':'repeat(3,1fr)',gap:'10px',marginBottom:'28px' }}>
            {[
              { icon: FolderOpen, label:'Total Workspaces', value: workspaces.length,                                              color:'#F59E0B' },
              { icon: Users,      label:'Total Members',    value: workspaces.reduce((a,ws) => a+(ws.members?.length||0),0),       color:'#3b82f6' },
              { icon: Zap,        label:'Active Boards',    value: workspaces.length,                                              color:'#10b981' },
            ].map(stat => (
              <div key={stat.label} style={{ background:'rgba(17,24,39,0.7)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',padding:'16px 20px',display:'flex',alignItems:'center',gap:'14px' }}>
                <div style={{ width:'40px',height:'40px',borderRadius:'10px',background: stat.color+'15',border:`1px solid ${stat.color}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <stat.icon style={{ width:18,height:18,color: stat.color }} />
                </div>
                <div>
                  <p style={{ fontSize:'24px',fontWeight:700,color:'#E5E7EB',margin:'0 0 2px',fontFamily:"'Cormorant Garamond',serif",lineHeight:1 }}>{stat.value}</p>
                  <p style={{ fontSize:'11px',color:'rgba(229,231,235,0.4)',margin:0,letterSpacing:'0.04em' }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div style={{ display:'grid',gridTemplateColumns:gridCols,gap:'16px' }}>
            {[...Array(isMobile?2:3)].map((_,i) => <SkeletonCard key={i} />)}
          </div>
        ) : workspaces.length === 0 ? (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding: isMobile?'48px 0':'80px 0',gap:'16px',textAlign:'center' }}>
            <div style={{ width:'72px',height:'72px',borderRadius:'16px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <FolderOpen style={{ width:30,height:30,color:'rgba(229,231,235,0.2)' }} />
            </div>
            <div>
              <p style={{ fontSize:'16px',color:'rgba(229,231,235,0.7)',margin:'0 0 6px',fontWeight:500 }}>No workspaces yet</p>
              <p style={{ fontSize:'13px',color:'rgba(229,231,235,0.35)',maxWidth:'280px',lineHeight:1.6,margin:0 }}>Create your first workspace or join one with an invite code.</p>
            </div>
            <div style={{ display:'flex',gap:'10px',flexWrap:'wrap',justifyContent:'center' }}>
              <button onClick={() => setModal('join')} style={{ padding:'10px 20px',fontSize:'12px',letterSpacing:'0.06em',color:'rgba(229,231,235,0.7)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',cursor:'pointer',fontFamily:'inherit',fontWeight:500 }}>JOIN WITH CODE</button>
              <button onClick={() => setModal('create')} style={{ padding:'10px 20px',fontSize:'12px',letterSpacing:'0.08em',color:'#0B0F14',background:'#F59E0B',border:'none',borderRadius:'10px',cursor:'pointer',fontFamily:'inherit',fontWeight:700,boxShadow:'0 4px 20px rgba(245,158,11,0.3)' }}>CREATE WORKSPACE</button>
            </div>
          </div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:gridCols,gap:'16px' }}>
            {workspaces.map(ws => (
              <WorkspaceCard
                key={ws._id} ws={ws}
                onClick={() => navigate(`/workspace/${ws._id}`)}
                canDelete={canDeleteWorkspace(ws)}
                onDelete={() => setDeleteTarget(ws)}
              />
            ))}
            {/* Add new card */}
            <button onClick={() => setModal('create')} style={{ minHeight:'160px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'10px',background:'transparent',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:'16px',cursor:'pointer',fontFamily:'inherit',color:'rgba(229,231,235,0.25)',fontSize:'12px',letterSpacing:'0.08em',transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(245,158,11,0.35)'; e.currentTarget.style.color='#F59E0B'; e.currentTarget.style.background='rgba(245,158,11,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(229,231,235,0.25)'; e.currentTarget.style.background='transparent'; }}
            >
              <Plus style={{ width:24,height:24 }} />
              NEW WORKSPACE
            </button>
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